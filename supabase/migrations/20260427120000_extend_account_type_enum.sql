-- ─────────────────────────────────────────────────────────────────────────
-- Extend the `account_type` enum with the products that Haitian
-- credit unions actually run. Existing rows (savings/deposit/wallet)
-- are unaffected.
-- ─────────────────────────────────────────────────────────────────────────

-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in older
-- PG versions, but Supabase migrations wrap automatically. Each ADD VALUE
-- is idempotent thanks to IF NOT EXISTS.

ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'current';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'checking';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'business';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'youth';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'salary';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'term_deposit';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'shares';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'loan_account';
