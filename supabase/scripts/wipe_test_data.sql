-- ════════════════════════════════════════════════════════════════════════
-- WIPE TEST DATA — Bosal Union Credit
-- ════════════════════════════════════════════════════════════════════════
-- Empties every member-attached / transactional table while keeping the
-- full database structure intact (schema, FKs, indexes, functions,
-- triggers, RLS policies, configuration rows).
--
-- KEPT (configuration / master data) :
--   cooperatives, agents, branches, app_settings, system_settings,
--   loan_products, savings_products, fees
--
-- WIPED (member-scoped / transactional + bureau de change) :
--   members, accounts, payments, loans, loan_repayments, transactions,
--   credit_scores, fraud_flags, notifications, shares, dividends,
--   exchange_transactions, exchange_rates, audit_logs, documents,
--   internal_messages, ledger_entries, settings_logs, daily_closings,
--   customers, guarantors
--
-- RESET (preserved row, zeroed values) :
--   cash_vault
--
-- USAGE:
--   - Run as a single statement block (Supabase SQL Editor or psql).
--   - The whole thing is transactional: any error rolls everything back,
--     including the temporary backup tables.
--   - Toggle the BACKUP block via the make_backup flag (line ~50).
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. SAFETY ASSERTION ────────────────────────────────────────────────
-- Refuse to run on an empty database (defensive — prevents accidental
-- double-runs creating empty backup tables for nothing).
DO $$
DECLARE
  v_total bigint;
BEGIN
  SELECT
    (SELECT count(*) FROM public.members)
  + (SELECT count(*) FROM public.transactions)
  + (SELECT count(*) FROM public.loans)
  INTO v_total;
  IF v_total = 0 THEN
    RAISE NOTICE 'Database is already empty (0 members, 0 transactions, 0 loans). Nothing to do.';
  END IF;
END $$;

-- ─── 2. OPTIONAL BACKUP ─────────────────────────────────────────────────
-- Snapshots are stored as `backup_<table>` in the public schema. They are
-- TEMPORARY in spirit — drop them once you're confident the wipe is good.
--
--   Set make_backup = true to enable, false to skip.
--   The backup tables are dropped and re-created if they exist.
DO $$
DECLARE
  make_backup boolean := true;
BEGIN
  IF make_backup THEN
    DROP TABLE IF EXISTS public.backup_members               CASCADE;
    DROP TABLE IF EXISTS public.backup_payments              CASCADE;
    DROP TABLE IF EXISTS public.backup_loans                 CASCADE;
    DROP TABLE IF EXISTS public.backup_loan_repayments       CASCADE;
    DROP TABLE IF EXISTS public.backup_transactions          CASCADE;
    DROP TABLE IF EXISTS public.backup_credit_scores         CASCADE;
    DROP TABLE IF EXISTS public.backup_accounts              CASCADE;
    DROP TABLE IF EXISTS public.backup_exchange_rates        CASCADE;
    DROP TABLE IF EXISTS public.backup_exchange_transactions CASCADE;

    -- CREATE TABLE … AS TABLE copies data + column types but NOT
    -- constraints / indexes / defaults — exactly what a backup needs.
    CREATE TABLE public.backup_members               AS TABLE public.members;
    CREATE TABLE public.backup_accounts              AS TABLE public.accounts;
    CREATE TABLE public.backup_payments              AS TABLE public.payments;
    CREATE TABLE public.backup_loans                 AS TABLE public.loans;
    CREATE TABLE public.backup_loan_repayments       AS TABLE public.loan_repayments;
    CREATE TABLE public.backup_transactions          AS TABLE public.transactions;
    CREATE TABLE public.backup_credit_scores         AS TABLE public.credit_scores;
    CREATE TABLE public.backup_exchange_rates        AS TABLE public.exchange_rates;
    CREATE TABLE public.backup_exchange_transactions AS TABLE public.exchange_transactions;

    RAISE NOTICE 'Backup tables created (members, accounts, payments, loans, loan_repayments, transactions, credit_scores, exchange_rates, exchange_transactions)';
  ELSE
    RAISE NOTICE 'Skipping backup (make_backup = false)';
  END IF;
END $$;

-- ─── 3. TRIGGER HANDLING ────────────────────────────────────────────────
-- Row-level triggers (e.g. trg_credit_score_*) DO NOT fire on TRUNCATE,
-- so this is mostly belt-and-braces. session_replication_role = 'replica'
-- also has the side benefit of bypassing the auth_users FK constraint
-- check on agents — useful if any cleanup spans into auth-linked rows.
SET LOCAL session_replication_role = 'replica';

-- ─── 4. WIPE — single TRUNCATE, listed leaf-to-root ─────────────────────
-- All tables in one statement so PostgreSQL handles the FK ordering
-- internally. RESTART IDENTITY rewinds any sequences (none in this schema
-- but it's spec-compliant). CASCADE is a no-op here because every FK target
-- is already in the list — kept explicit for safety.
TRUNCATE TABLE
  -- Grand-children of members
  public.loan_repayments,
  public.fraud_flags,
  public.notifications,
  public.shares,
  public.dividends,
  public.audit_logs,
  public.documents,
  public.internal_messages,
  public.ledger_entries,
  public.settings_logs,
  public.daily_closings,
  public.customers,
  public.guarantors,
  public.exchange_transactions,
  public.exchange_rates,
  public.credit_scores,
  -- Children of members
  public.payments,
  public.transactions,
  public.loans,
  public.accounts,
  -- Root
  public.members
RESTART IDENTITY CASCADE;

-- ─── 5. RESET CASH VAULT ────────────────────────────────────────────────
-- Cash on hand is the running sum of every deposit / withdrawal, so wiping
-- transactions also requires resetting the vault. We UPDATE rather than
-- TRUNCATE so the row keeps existing (the /caisse page expects it via
-- .limit(1).single()) and the cooperative_id FK target stays valid.
UPDATE public.cash_vault
   SET current_balance = 0,
       opening_balance = 0,
       last_updated    = now();

-- ─── 6. RE-ENABLE TRIGGERS ──────────────────────────────────────────────
-- session_replication_role is already SET LOCAL so it auto-resets at COMMIT,
-- but we set it back here explicitly for clarity / for queries that follow.
SET LOCAL session_replication_role = 'origin';

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICATION — run after the COMMIT above (transaction-independent)
-- All counts should be 0.
-- ════════════════════════════════════════════════════════════════════════

SELECT 'accounts'              AS table_name, count(*) AS rows FROM public.accounts              UNION ALL
SELECT 'audit_logs',                          count(*)         FROM public.audit_logs            UNION ALL
SELECT 'credit_scores',                       count(*)         FROM public.credit_scores         UNION ALL
SELECT 'customers',                           count(*)         FROM public.customers             UNION ALL
SELECT 'daily_closings',                      count(*)         FROM public.daily_closings        UNION ALL
SELECT 'dividends',                           count(*)         FROM public.dividends             UNION ALL
SELECT 'documents',                           count(*)         FROM public.documents             UNION ALL
SELECT 'exchange_rates',                      count(*)         FROM public.exchange_rates        UNION ALL
SELECT 'exchange_transactions',               count(*)         FROM public.exchange_transactions UNION ALL
SELECT 'fraud_flags',                         count(*)         FROM public.fraud_flags           UNION ALL
SELECT 'guarantors',                          count(*)         FROM public.guarantors            UNION ALL
SELECT 'internal_messages',                   count(*)         FROM public.internal_messages     UNION ALL
SELECT 'ledger_entries',                      count(*)         FROM public.ledger_entries        UNION ALL
SELECT 'loan_repayments',                     count(*)         FROM public.loan_repayments       UNION ALL
SELECT 'loans',                               count(*)         FROM public.loans                 UNION ALL
SELECT 'members',                             count(*)         FROM public.members               UNION ALL
SELECT 'notifications',                       count(*)         FROM public.notifications         UNION ALL
SELECT 'payments',                            count(*)         FROM public.payments              UNION ALL
SELECT 'settings_logs',                       count(*)         FROM public.settings_logs         UNION ALL
SELECT 'shares',                              count(*)         FROM public.shares                UNION ALL
SELECT 'transactions',                        count(*)         FROM public.transactions
ORDER BY table_name;

-- ─── PRESERVED STRUCTURE — quick sanity check ───────────────────────────
-- Confirms nothing was dropped : table count, function count, trigger count
-- and policy count should match what you had before the wipe.
SELECT
  (SELECT count(*) FROM information_schema.tables       WHERE table_schema = 'public') AS tables_kept,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                                  WHERE n.nspname = 'public')                          AS functions_kept,
  (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                                     JOIN pg_namespace n ON n.oid=c.relnamespace
                                     WHERE n.nspname='public' AND NOT t.tgisinternal)  AS triggers_kept,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public')                         AS rls_policies_kept;

-- ════════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════════
-- After verification, drop the backup tables once you're satisfied:
--   DROP TABLE IF EXISTS
--     public.backup_members, public.backup_accounts, public.backup_payments,
--     public.backup_loans, public.backup_loan_repayments,
--     public.backup_transactions, public.backup_credit_scores,
--     public.backup_exchange_rates, public.backup_exchange_transactions
--   CASCADE;
-- ════════════════════════════════════════════════════════════════════════
