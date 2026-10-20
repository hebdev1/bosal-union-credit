-- ─────────────────────────────────────────────────────────────────────────
-- Write guards, second pass (audit 2026-10-20, second adversarial review)
--
-- Gaps still open after 20261020171023_direct_write_guards, all reachable
-- by an agent calling PostgREST with their own session:
--  * transactions: 'transfer' / 'adjustment' rows could be inserted
--    (get_vault_balance counts 'transfer' as cash out while the account
--    balance ignores it: the vault could be lowered with no member debit);
--    created_at could be forged (dodges the fraud trigger's night and
--    frequency rules, which read created_at).
--  * exchange_transactions: rate, currencies and amounts were free in a
--    direct insert; created_at could be back-dated into closed days.
--  * loans: a pending loan could carry totals unrelated to its principal.
--  * loan_repayments: negative amounts, client-chosen paid_at.
--  * accounts: a manager could change currency / owner of an account.
--  * members / accounts / loans / repayments: created_at rewritable
--    (feeds the inactivity rule and the credit score).
--  * credit_scores, payments, shares, documents: FOR ALL write policies
--    for every agent (scores are only written by refresh_member_credit_score;
--    payments feed the score; shares feed the BRH and balance-sheet reports).
--
-- Same convention as before: guards only act when current_user =
-- 'authenticated'; SECURITY DEFINER recomputes, pg_cron and migrations run
-- as the owner and are unaffected.
--
-- Dry-run before applying: 34 role-simulated checks, all as expected.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── 1. transactions ───────────────────────────────────────────────────────
create or replace function public._guard_transactions_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.transaction_type::text not in ('deposit', 'withdrawal') then
      raise exception 'Seuls les dépôts et les retraits peuvent être saisis.' using errcode = '42501';
    end if;
    if coalesce(new.status, 'completed') <> 'completed' then
      raise exception 'Une transaction est enregistrée avec le statut « completed ».' using errcode = '42501';
    end if;
    new.status     := 'completed';
    new.created_at := now();
    return new;
  end if;

  -- UPDATE (admins only, by policy): the type and the creation time stay.
  if new.transaction_type is distinct from old.transaction_type
     and new.transaction_type::text not in ('deposit', 'withdrawal') then
    raise exception 'Seuls les dépôts et les retraits sont autorisés.' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  return new;
end;
$function$;

drop trigger if exists trg_guard_transactions_write on public.transactions;
create trigger trg_guard_transactions_write
before insert or update on public.transactions
for each row execute function public._guard_transactions_write();

-- ─── 2. exchange_transactions: everything derived from the rate row ────────
create or replace function public._guard_exchange_transactions_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  r record;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    if new.agent_id is distinct from auth.uid() then
      raise exception 'Une opération de change doit être enregistrée au nom de l''agent connecté.' using errcode = '42501';
    end if;

    select er.from_currency, er.to_currency, er.rate, er.is_active, er.cooperative_id
      into r
      from public.exchange_rates er
     where er.id = new.exchange_rate_id;
    if not found or r.cooperative_id is distinct from new.cooperative_id then
      raise exception 'Taux de change introuvable.' using errcode = '42501';
    end if;
    if r.is_active is false then
      raise exception 'Ce taux de change n''est plus actif.' using errcode = '42501';
    end if;

    new.from_currency   := r.from_currency;
    new.to_currency     := r.to_currency;
    new.rate_applied    := r.rate;
    new.amount_received := round(new.amount_given * r.rate, 2);
    new.created_at      := now();
    return new;
  end if;

  if coalesce(public.get_my_role(), '') <> 'admin' then
    raise exception 'Seul un administrateur peut modifier ou supprimer une opération de change.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return coalesce(new, old);
end;
$function$;

-- ─── 3. loans: totals derived from the terms, created_at pinned ────────────
create or replace function public._guard_loans_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_role     text;
  v_manager  boolean;
  v_expected numeric;
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;
  v_role    := coalesce(public.get_my_role(), '');
  v_manager := v_role in ('admin', 'manager');

  if tg_op = 'DELETE' then
    if v_role <> 'admin' then
      raise exception 'Seul un administrateur peut supprimer un prêt.' using errcode = '42501';
    end if;
    return old;
  end if;

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
    new.created_at := now();
  else
    -- UPDATE
    new.created_at := old.created_at;
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
  end if;

  -- While a loan can still change (creation, pending), the totals are
  -- derived in the database from the terms, with the same flat-rate
  -- formula as createLoan / adjustLoan:
  --   total = principal × (1 + rate/100 × months/12), monthly = total / months.
  if tg_op = 'INSERT' or old.status::text = 'pending' then
    v_expected := new.principal_amount * (1 + new.interest_rate / 100 * new.duration_months / 12.0);
    new.total_amount_due := round(v_expected, 2);
    new.monthly_payment  := round(v_expected / new.duration_months, 2);
  end if;
  return new;
end;
$function$;

-- ─── 4. loan_repayments: non-negative, server-set timestamps ───────────────
alter table public.loan_repayments
  drop constraint if exists loan_repayments_amounts_non_negative;
alter table public.loan_repayments
  add constraint loan_repayments_amounts_non_negative
  check (coalesce(amount_paid, 0) >= 0 and amount_due >= 0);

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

  if tg_op = 'INSERT' then
    new.created_at := now();
    new.paid_at    := case when coalesce(new.amount_paid, 0) > 0 then now() end;
  else
    new.created_at := old.created_at;
    if new.amount_paid is distinct from old.amount_paid then
      new.paid_at := case when coalesce(new.amount_paid, 0) > 0 then now() end;
    else
      new.paid_at := old.paid_at;
    end if;
  end if;
  return new;
end;
$function$;

-- ─── 5. members: created_at pinned (insert guard added) ────────────────────
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

  if tg_op = 'INSERT' then
    new.created_at := now();
    return new;
  end if;

  if tg_op = 'DELETE' then
    if v_role <> 'admin' then
      raise exception 'Seul un administrateur peut supprimer un membre.' using errcode = '42501';
    end if;
    return old;
  end if;

  if new.status is distinct from old.status and v_role not in ('admin', 'manager') then
    raise exception 'Seul un administrateur ou un gérant peut changer le statut d''un membre.' using errcode = '42501';
  end if;
  if new.cooperative_id is distinct from old.cooperative_id then
    raise exception 'Un membre ne peut pas changer de coopérative.' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  return new;
end;
$function$;

drop trigger if exists trg_guard_members_write on public.members;
create trigger trg_guard_members_write
before insert or update or delete on public.members
for each row execute function public._guard_members_write();

-- ─── 6. accounts: owner, currency and number immutable ─────────────────────
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
    new.created_at := now();
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
  if new.currency       is distinct from old.currency
     or new.member_id      is distinct from old.member_id
     or new.cooperative_id is distinct from old.cooperative_id
     or new.account_number is distinct from old.account_number then
    raise exception 'Le titulaire, la devise et le numéro d''un compte ne sont pas modifiables.' using errcode = '42501';
  end if;
  if v_role not in ('admin', 'manager') then
    raise exception 'Seul un administrateur ou un gérant peut modifier un compte.' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  return new;
end;
$function$;

revoke execute on function public._guard_transactions_write()          from public, anon, authenticated;
revoke execute on function public._guard_exchange_transactions_write() from public, anon, authenticated;
revoke execute on function public._guard_loans_write()                 from public, anon, authenticated;
revoke execute on function public._guard_loan_repayments_write()       from public, anon, authenticated;
revoke execute on function public._guard_members_write()               from public, anon, authenticated;
revoke execute on function public._guard_accounts_write()              from public, anon, authenticated;

-- ─── 7. Secondary tables: role-scoped writes ───────────────────────────────
-- credit_scores: only refresh_member_credit_score (SECURITY DEFINER) writes.
drop policy if exists credit_scores_agent_write on public.credit_scores;

-- payments: not written by the app; feeds the credit score. Admin/manager.
drop policy if exists payments_agent_write on public.payments;
create policy payments_write_manager on public.payments
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'))
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager')
              and (agent_id is null or agent_id = (select auth.uid())));

-- shares (BRH / balance-sheet reports) and documents (KYC): read for the
-- cooperative, write for admin/manager.
drop policy if exists shares_access       on public.shares;
drop policy if exists shares_select       on public.shares;
drop policy if exists shares_write        on public.shares;
create policy shares_select on public.shares
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));
create policy shares_write on public.shares
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'))
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'));

drop policy if exists documents_access on public.documents;
drop policy if exists documents_select on public.documents;
drop policy if exists documents_write  on public.documents;
create policy documents_select on public.documents
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));
create policy documents_write on public.documents
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'))
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'));
