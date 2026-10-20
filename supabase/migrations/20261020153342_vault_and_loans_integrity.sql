-- ─────────────────────────────────────────────────────────────────────────
-- Vault + loans integrity (audit 2026-10-19)
--
-- 1. cash_vault: the live trigger trg_sync_vault already recomputes
--    current_balance = get_vault_balance(coop) after every transaction, and
--    recordTransaction then applied ±amount a second time from JS. The app
--    write is removed in code and blocked by RLS (cash_vault is now
--    read-only for agents). This repairs the stored figure once (it was
--    off by the last withdrawal, applied twice) and types the money
--    columns.
--
-- 2. loans.amount_paid: maintained by a trigger on loan_repayments instead
--    of a read-sum-write in the server action (lost-update race).
-- ─────────────────────────────────────────────────────────────────────────

-- ─── 1. cash_vault ─────────────────────────────────────────────────────────
alter table public.cash_vault
  alter column current_balance type numeric(15,2) using round(current_balance::numeric, 2),
  alter column opening_balance type numeric(15,2) using round(opening_balance::numeric, 2);

update public.cash_vault
   set current_balance = public.get_vault_balance(cooperative_id),
       last_updated    = now()
 where cooperative_id is not null;

-- ─── 2. loans.amount_paid trigger ──────────────────────────────────────────
create or replace function public.recompute_loan_amount_paid(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if p_loan_id is null then return; end if;
  update public.loans
     set amount_paid = round(coalesce(
           (select sum(amount_paid) from public.loan_repayments where loan_id = p_loan_id), 0), 2)
   where id = p_loan_id;
end;
$function$;

create or replace function public._trg_loan_amount_paid()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_loan_amount_paid(new.loan_id);
  end if;
  if tg_op = 'UPDATE' and old.loan_id is distinct from new.loan_id then
    perform public.recompute_loan_amount_paid(old.loan_id);
  end if;
  if tg_op = 'DELETE' then
    perform public.recompute_loan_amount_paid(old.loan_id);
  end if;
  return null;
end;
$function$;

drop trigger if exists trg_loan_amount_paid on public.loan_repayments;
create trigger trg_loan_amount_paid
after insert or update or delete on public.loan_repayments
for each row execute function public._trg_loan_amount_paid();

revoke execute on function public.recompute_loan_amount_paid(uuid) from public, anon, authenticated;
revoke execute on function public._trg_loan_amount_paid()          from public, anon, authenticated;

-- Align existing rows (0 loans live today — no-op, kept for rebuilds)
do $$
declare l record;
begin
  for l in select id from public.loans loop
    perform public.recompute_loan_amount_paid(l.id);
  end loop;
end $$;
