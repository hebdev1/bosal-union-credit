-- ─────────────────────────────────────────────────────────────────────────
-- Backfill : legacy opening balances → vraies transactions
--
-- Problème : avant le commit 342d2e8 (« Solde d'ouverture devient un vrai
-- dépôt »), accounts.balance était écrit directement depuis le champ
-- « Solde initial » de la modale, sans créer de ligne dans transactions.
-- Le trigger trg_account_balance_from_transaction calcule désormais
-- balance = SUM(deposits) − SUM(withdrawals), donc au premier dépôt/retrait
-- sur un compte legacy le balance « écrasait » le solde d'ouverture
-- au lieu de s'y additionner.
--
-- Cette migration insère une transaction d'ouverture pour chaque compte
-- qui a un solde mais aucune transaction, datée du created_at du compte,
-- afin que la formule cumulative reflète le bon montant.
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

SET LOCAL session_replication_role = 'replica';

-- Solde positif → dépôt d'ouverture
INSERT INTO public.transactions (
  cooperative_id, account_id, agent_id, transaction_type,
  amount, motif, reference, status, transaction_date, created_at
)
SELECT
  a.cooperative_id,
  a.id,
  COALESCE(
    (SELECT id FROM public.agents WHERE cooperative_id = a.cooperative_id AND role = 'admin' LIMIT 1),
    (SELECT id FROM public.agents WHERE cooperative_id = a.cooperative_id LIMIT 1)
  ),
  'deposit',
  a.balance::numeric,
  'Solde d''ouverture (backfill)',
  'BACKFILL-' || substring(a.id::text, 1, 8),
  'completed',
  COALESCE(a.created_at, now()),
  COALESCE(a.created_at, now())
FROM public.accounts a
WHERE a.balance::numeric > 0
  AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.account_id = a.id);

-- Solde négatif → retrait d'ouverture
INSERT INTO public.transactions (
  cooperative_id, account_id, agent_id, transaction_type,
  amount, motif, reference, status, transaction_date, created_at
)
SELECT
  a.cooperative_id,
  a.id,
  COALESCE(
    (SELECT id FROM public.agents WHERE cooperative_id = a.cooperative_id AND role = 'admin' LIMIT 1),
    (SELECT id FROM public.agents WHERE cooperative_id = a.cooperative_id LIMIT 1)
  ),
  'withdrawal',
  ABS(a.balance::numeric),
  'Solde d''ouverture négatif (backfill)',
  'BACKFILL-' || substring(a.id::text, 1, 8),
  'completed',
  COALESCE(a.created_at, now()),
  COALESCE(a.created_at, now())
FROM public.accounts a
WHERE a.balance::numeric < 0
  AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.account_id = a.id);

SET LOCAL session_replication_role = 'origin';

-- Synchronise tous les soldes (idempotent — appelable plusieurs fois).
DO $$
DECLARE a record;
BEGIN
  FOR a IN SELECT id FROM public.accounts LOOP
    PERFORM public.recompute_account_balance(a.id);
  END LOOP;
END $$;

COMMIT;
