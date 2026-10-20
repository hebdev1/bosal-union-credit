-- ─────────────────────────────────────────────────────────────────────────
-- Direct-write guards + lost-update fixes (audit 2026-10-20, review pass)
--
-- The role checks added to the server actions can be skipped by an agent
-- who calls PostgREST directly with their own session (the *_access
-- policies on accounts, loans, loan_repayments, members and
-- exchange_transactions are FOR ALL, scoped by cooperative only).
--
-- BEFORE triggers enforce the same rules in the database. They only apply
-- to the `authenticated` role: the SECURITY DEFINER triggers and functions
-- (balance recompute, amount_paid recompute, pg_cron inactivity job,
-- onboard_member) run as the owner and are not affected, nor is
-- service_role. Cashier flows keep working: opening accounts, creating
-- loans, recording repayments and completing a fully repaid loan.
--
-- Also:
--  * transactions_insert binds agent_id to the caller;
--  * audit_logs_insert no longer accepts unattributed rows;
--  * default privileges no longer give EXECUTE on new functions to
--    authenticated (new functions created by postgres are closed by
--    default; supabase_admin's defaults cannot be changed from here);
--  * recompute_account_balance / recompute_loan_amount_paid /
--    sync_vault_balance lock the parent row before summing, so two
--    concurrent inserts on the same account or loan cannot leave a stale
--    total (READ COMMITTED: the sum runs after the lock, on a fresh
--    snapshot). FOR NO KEY UPDATE does not conflict with the KEY SHARE
--    lock taken by the foreign-key check, so it cannot deadlock with it.
--
-- Dry-run before applying: 42 role-simulated checks, all as expected.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── 1. accounts ───────────────────────────────────────────────────────────
create or replace function public._guard_accounts_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_role text;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;
  v_role := coalesce(public.get_my_role(), '');

  if tg_op = 'INSERT' then
    if coalesce(new.balance, 0) <> 0 then
      raise exception 'Le solde d''un compte est calculé à partir de ses transactions : il doit être créé à 0.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if v_role <> 'admin' then
      raise exception 'Seul un administrateur peut supprimer un compte.' using errcode = '42501';
    end if;
    return old;
  end if;

  -- UPDATE
  if new.balance is distinct from old.balance then
    raise exception 'Le solde d''un compte ne se modifie que par des transactions.' using errcode = '42501';
  end if;
  if v_role not in ('admin', 'manager') then
    raise exception 'Seul un administrateur ou un gérant peut modifier un compte.' using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_guard_accounts_write on public.accounts;
create trigger trg_guard_accounts_write
before insert or update or delete on public.accounts
for each row execute function public._guard_accounts_write();

-- ─── 2. loans ──────────────────────────────────────────────────────────────
create or replace function public._guard_loans_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_role    text;
  v_manager boolean;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;
  v_role    := coalesce(public.get_my_role(), '');
  v_manager := v_role in ('admin', 'manager');

  if tg_op = 'INSERT' then
    if coalesce(new.amount_paid, 0) <> 0 then
      raise exception 'Un prêt est créé avec un montant remboursé de 0.' using errcode = '42501';
    end if;
    if new.agent_id is distinct from auth.uid() then
      raise exception 'Un prêt doit être créé au nom de l''agent connecté.' using errcode = '42501';
    end if;
    if not v_manager and coalesce(new.status::text, 'pending') <> 'pending' then
      raise exception 'Un prêt créé par un caissier doit être en attente d''approbation.' using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if v_role <> 'admin' then
      raise exception 'Seul un administrateur peut supprimer un prêt.' using errcode = '42501';
    end if;
    return old;
  end if;

  -- UPDATE
  if new.amount_paid is distinct from old.amount_paid then
    raise exception 'Le montant remboursé est calculé à partir des versements.' using errcode = '42501';
  end if;
  if new.cooperative_id is distinct from old.cooperative_id
     or new.member_id   is distinct from old.member_id
     or new.account_id  is distinct from old.account_id
     or new.agent_id    is distinct from old.agent_id
     or new.loan_number is distinct from old.loan_number then
    raise exception 'L''emprunteur, le compte, l''agent et le numéro d''un prêt ne sont pas modifiables.' using errcode = '42501';
  end if;
  if (new.principal_amount is distinct from old.principal_amount
      or new.interest_rate    is distinct from old.interest_rate
      or new.duration_months  is distinct from old.duration_months
      or new.monthly_payment  is distinct from old.monthly_payment
      or new.total_amount_due is distinct from old.total_amount_due
      or new.due_date         is distinct from old.due_date)
     and old.status::text <> 'pending' then
    raise exception 'Les conditions d''un prêt ne sont modifiables que tant qu''il est en attente.' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not v_manager then
    -- A cashier may only close a fully repaid active loan.
    if not (old.status::text = 'active'
            and new.status::text = 'completed'
            and coalesce(new.amount_paid, 0) >= coalesce(new.total_amount_due, 0)
            and coalesce(new.total_amount_due, 0) > 0) then
      raise exception 'Seul un administrateur ou un gérant peut changer le statut d''un prêt.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_guard_loans_write on public.loans;
create trigger trg_guard_loans_write
before insert or update or delete on public.loans
for each row execute function public._guard_loans_write();

-- ─── 3. loan_repayments ────────────────────────────────────────────────────
create or replace function public._guard_loan_repayments_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_role text;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;
  v_role := coalesce(public.get_my_role(), '');

  if tg_op = 'DELETE' then
    if v_role <> 'admin' then
      raise exception 'Seul un administrateur peut supprimer un versement.' using errcode = '42501';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.status::text = 'paid' and v_role <> 'admin' then
    raise exception 'Versement déjà soldé : modification interdite.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.loan_id is distinct from old.loan_id then
    raise exception 'Un versement ne peut pas changer de prêt.' using errcode = '42501';
  end if;
  if new.agent_id is distinct from auth.uid() then
    raise exception 'Un versement doit être enregistré au nom de l''agent connecté.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.loans l
     where l.id = new.loan_id
       and l.cooperative_id = new.cooperative_id
       and l.status::text = 'active'
  ) then
    raise exception 'Les versements ne sont acceptés que sur un prêt actif de la coopérative.' using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_guard_loan_repayments_write on public.loan_repayments;
create trigger trg_guard_loan_repayments_write
before insert or update or delete on public.loan_repayments
for each row execute function public._guard_loan_repayments_write();

-- ─── 4. members ────────────────────────────────────────────────────────────
create or replace function public._guard_members_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_role text;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;
  v_role := coalesce(public.get_my_role(), '');

  if tg_op = 'DELETE' then
    if v_role <> 'admin' then
      raise exception 'Seul un administrateur peut supprimer un membre.' using errcode = '42501';
    end if;
    return old;
  end if;

  if new.status is distinct from old.status and v_role not in ('admin', 'manager') then
    raise exception 'Seul un administrateur ou un gérant peut changer le statut d''un membre.' using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_guard_members_write on public.members;
create trigger trg_guard_members_write
before update or delete on public.members
for each row execute function public._guard_members_write();

-- ─── 5. exchange_transactions ──────────────────────────────────────────────
create or replace function public._guard_exchange_transactions_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    if new.agent_id is distinct from auth.uid() then
      raise exception 'Une opération de change doit être enregistrée au nom de l''agent connecté.' using errcode = '42501';
    end if;
    return new;
  end if;

  if coalesce(public.get_my_role(), '') <> 'admin' then
    raise exception 'Seul un administrateur peut modifier ou supprimer une opération de change.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_guard_exchange_transactions_write on public.exchange_transactions;
create trigger trg_guard_exchange_transactions_write
before insert or update or delete on public.exchange_transactions
for each row execute function public._guard_exchange_transactions_write();

-- Guard functions run as the caller (they must see current_user); nobody
-- needs to call them directly. Trigger firing does not check EXECUTE.
revoke execute on function public._guard_accounts_write()              from public, anon, authenticated;
revoke execute on function public._guard_loans_write()                 from public, anon, authenticated;
revoke execute on function public._guard_loan_repayments_write()       from public, anon, authenticated;
revoke execute on function public._guard_members_write()               from public, anon, authenticated;
revoke execute on function public._guard_exchange_transactions_write() from public, anon, authenticated;

-- ─── 6. Policies: attribution ──────────────────────────────────────────────
drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (
    cooperative_id = (select public.get_my_cooperative())
    and agent_id = (select auth.uid())
    and exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.cooperative_id = (select public.get_my_cooperative())
    )
  );

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    cooperative_id = (select public.get_my_cooperative())
    and user_id = (select auth.uid())
  );

-- ─── 7. Default privileges: new functions closed for authenticated too ─────
alter default privileges in schema public revoke execute on functions from authenticated;

-- ─── 8. Lock-then-sum recomputes ───────────────────────────────────────────
create or replace function public.recompute_account_balance(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_balance numeric;
begin
  if p_account_id is null then return; end if;

  -- Serialise concurrent recomputes of the same account; the sum below
  -- then sees every committed transaction.
  perform 1 from public.accounts where id = p_account_id for no key update;

  select coalesce(sum(
    case
      when transaction_type = 'deposit'    then  amount
      when transaction_type = 'withdrawal' then -amount
      else 0
    end
  ), 0)
  into v_balance
  from public.transactions
  where account_id = p_account_id;

  update public.accounts
     set balance = round(v_balance, 2)
   where id = p_account_id;
end;
$function$;

create or replace function public.recompute_loan_amount_paid(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_paid numeric;
begin
  if p_loan_id is null then return; end if;

  perform 1 from public.loans where id = p_loan_id for no key update;

  select round(coalesce(sum(amount_paid), 0), 2) into v_paid
    from public.loan_repayments where loan_id = p_loan_id;

  update public.loans set amount_paid = v_paid where id = p_loan_id;
end;
$function$;

create or replace function public.sync_vault_balance()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_coop uuid := coalesce(new.cooperative_id, old.cooperative_id);
begin
  perform 1 from public.cash_vault where cooperative_id = v_coop for no key update;

  update public.cash_vault
     set current_balance = public.get_vault_balance(v_coop),
         last_updated    = now()
   where cooperative_id = v_coop;
  return new;
end;
$function$;

-- create or replace keeps ACLs; re-assert them.
revoke execute on function public.recompute_account_balance(uuid)  from public, anon, authenticated;
revoke execute on function public.recompute_loan_amount_paid(uuid) from public, anon, authenticated;
revoke execute on function public.sync_vault_balance()             from public, anon, authenticated;
