
-- ============================================================
-- PERF 4 : Suppression des 3 index inutilisés
-- idx_audit_logs_cooperative_created conservé intentionnellement
-- (croissance rapide des audit_logs en production)
-- ============================================================

DROP INDEX IF EXISTS public.idx_ledger_entries_account;
DROP INDEX IF EXISTS public.idx_fraud_flags_transaction;
DROP INDEX IF EXISTS public.idx_fraud_flags_cooperative_severity;
;
