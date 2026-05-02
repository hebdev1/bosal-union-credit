-- ─────────────────────────────────────────────────────────────────────────
-- Historical Transaction Entry — schema support
--
-- Adds `transaction_date` to the transactions table:
--   * USER INPUT — when the operation actually took place (paper records).
--   * Defaults to now() for "Current mode" entries.
--   * created_at remains SYSTEM-GENERATED (actual insert wall-clock).
--
-- Integrity rule (DB-level, enforced even if the API is bypassed):
--   transaction_date <= now() at INSERT/UPDATE time.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.transactions
  add column if not exists transaction_date timestamptz;

update public.transactions
   set transaction_date = created_at
 where transaction_date is null;

alter table public.transactions
  alter column transaction_date set default now(),
  alter column transaction_date set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_transaction_date_not_future_chk'
  ) then
    alter table public.transactions
      add constraint transactions_transaction_date_not_future_chk
      check (transaction_date <= now() + interval '1 minute');
  end if;
end $$;

create index if not exists idx_transactions_transaction_date
  on public.transactions (transaction_date desc);

create index if not exists idx_transactions_account_transaction_date
  on public.transactions (account_id, transaction_date desc);

comment on column public.transactions.transaction_date is
  'When the transaction actually took place (user input). Differs from created_at when reconstructing history from paper records.';
