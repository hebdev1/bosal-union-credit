-- ─────────────────────────────────────────────────────────────────────────
-- Transactions: idempotency key (audit 2026-10-19)
--
-- idempotency_key is generated once per form by the client. A retried or
-- re-submitted request with the same key cannot create a second row: the
-- server action catches the unique violation and returns the existing
-- transaction instead.
--
-- The unique index on references is applied separately, after the new
-- reference generator is deployed (see transactions_reference_unique).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.transactions
  add column if not exists idempotency_key uuid;

create unique index if not exists transactions_coop_idempotency_key_uniq
  on public.transactions (cooperative_id, idempotency_key)
  where idempotency_key is not null;

comment on column public.transactions.idempotency_key is
  'Client-generated key (one per form). Prevents a retried submit from creating a duplicate transaction.';
