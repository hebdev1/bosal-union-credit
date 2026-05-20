-- ─────────────────────────────────────────────────────────────────────────
-- accounts.balance = SUM(deposits) − SUM(withdrawals)
--
-- The agent UI displays "Solde actuel" right next to "Flux net" — they
-- must always match. This migration installs a SQL function that
-- recomputes the balance for a single account, an AFTER trigger on
-- transactions that fires it on every INSERT / UPDATE / DELETE, and
-- backfills every account that currently drifts.
--
-- Transfers and adjustments are intentionally excluded — same convention
-- as the UI's flux net (deposits − withdrawals).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.recompute_account_balance(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_account_id is null then return; end if;

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
$$;

comment on function public.recompute_account_balance(uuid) is
  'Sets accounts.balance = SUM(deposits) − SUM(withdrawals) for a single account. Idempotent. Called by the transactions trigger and on-demand from server actions.';

-- ─── Trigger function ──────────────────────────────────────────────────────
create or replace function public._trg_balance_from_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op in ('INSERT','UPDATE')) and new.account_id is not null then
    perform public.recompute_account_balance(new.account_id);
  end if;
  if tg_op = 'UPDATE'
     and old.account_id is not null
     and old.account_id is distinct from new.account_id then
    perform public.recompute_account_balance(old.account_id);
  end if;
  if tg_op = 'DELETE' and old.account_id is not null then
    perform public.recompute_account_balance(old.account_id);
  end if;
  return null;
end;
$$;

-- ─── Wire trigger ──────────────────────────────────────────────────────────
drop trigger if exists trg_account_balance_from_transaction on public.transactions;
create trigger trg_account_balance_from_transaction
after insert or update or delete on public.transactions
for each row execute function public._trg_balance_from_transaction();

-- ─── One-shot backfill ─────────────────────────────────────────────────────
set local session_replication_role = 'replica';

do $$
declare a record;
begin
  for a in select id from public.accounts loop
    perform public.recompute_account_balance(a.id);
  end loop;
end $$;

set local session_replication_role = 'origin';

-- ─── Permissions ───────────────────────────────────────────────────────────
revoke all on function public.recompute_account_balance(uuid)        from anon, public;
revoke all on function public._trg_balance_from_transaction()        from anon, public;
grant  execute on function public.recompute_account_balance(uuid)    to authenticated;
