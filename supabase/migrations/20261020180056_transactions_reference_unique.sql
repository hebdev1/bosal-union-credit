-- ─────────────────────────────────────────────────────────────────────────
-- transactions.reference unique per cooperative — for rows created after
-- the new reference generator went live (audit 2026-10-20).
--
-- Applied after commit 88cb0ce (src/lib/transactions/reference.ts:
-- PREFIX-YYYYMMDD-6 base36 chars from crypto.getRandomValues) was deployed
-- to production at 2026-10-20 17:59:13 UTC. The old 4-digit generator
-- collided (9,000 values per day); the historical duplicate is older than
-- the cutoff and is left untouched. Pre-check: 0 rows and 0 duplicates
-- since the cutoff, 0 null references.
--
-- On a collision the server actions retry once with a new reference
-- (any 23505 that is not the idempotency index).
-- ─────────────────────────────────────────────────────────────────────────

create unique index if not exists transactions_coop_reference_uniq_since_20261020
  on public.transactions (cooperative_id, reference)
  where created_at >= timestamptz '2026-10-20 17:59:13+00';
