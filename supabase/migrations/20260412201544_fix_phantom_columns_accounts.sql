
-- ============================================================
-- BUG 3 : Suppression des fonctions qui référencent des
--         colonnes inexistantes dans accounts
--         (balance_total, reserve_locked, daily_withdrawn,
--          daily_withdraw_date) et corrections associées
-- ============================================================

-- 1. Supprimer le trigger orphelin process_transaction
--    (la fonction existe mais n'est attachée à aucun trigger)
DROP FUNCTION IF EXISTS public.process_transaction() CASCADE;

-- 2. Supprimer reset_daily_withdrawals (100% colonnes fantômes)
DROP FUNCTION IF EXISTS public.reset_daily_withdrawals(uuid) CASCADE;

-- 3. Réécrire get_cooperative_summary avec les vraies colonnes
--    - balance_total   → balance (colonne réelle)
--    - reserve_locked  → 0 (colonne inexistante, supprimée du calcul)
--    - daily_withdrawn → 0 (colonne inexistante, supprimée du calcul)
--    - customers       → members (bonne table)
--    - t.fraud_flag    → table fraud_flags (transactions n'a pas fraud_flag)
DROP FUNCTION IF EXISTS public.get_cooperative_summary(uuid);

CREATE OR REPLACE FUNCTION public.get_cooperative_summary(coop_id uuid)
RETURNS TABLE(
    total_balance         numeric,
    total_members         bigint,
    vault_balance         numeric,
    flagged_count         bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(a.balance), 0)                         AS total_balance,
        (SELECT COUNT(*)
         FROM members m
         WHERE m.cooperative_id = coop_id
           AND m.status = 'active')                         AS total_members,
        (SELECT COALESCE(v.current_balance, 0)
         FROM cash_vault v
         WHERE v.cooperative_id = coop_id
         LIMIT 1)                                           AS vault_balance,
        (SELECT COUNT(*)
         FROM fraud_flags ff
         JOIN transactions t ON t.id = ff.transaction_id
         WHERE t.cooperative_id = coop_id
           AND ff.severity = 'high')                        AS flagged_count
    FROM accounts a
    WHERE a.cooperative_id = coop_id;
END;
$$;
;
