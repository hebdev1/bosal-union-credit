
-- ============================================================
-- SEC 1 : Convertir cooperative_stats et members_with_age
--         de SECURITY DEFINER → SECURITY INVOKER
--         pour que le RLS soit respecté par ces vues
-- ============================================================

CREATE OR REPLACE VIEW public.cooperative_stats
WITH (security_invoker = true) AS
SELECT
    a.cooperative_id,
    COUNT(DISTINCT a.member_id)                                          AS total_members,
    COUNT(a.id)                                                          AS total_accounts,
    COALESCE(SUM(a.balance), 0)                                          AS total_liquidity,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'deposit'
                      THEN t.amount ELSE 0 END), 0)                      AS total_deposits,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'withdrawal'
                      THEN t.amount ELSE 0 END), 0)                      AS total_withdrawals,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'transfer'
                      THEN t.amount ELSE 0 END), 0)                      AS total_transfers
FROM accounts a
LEFT JOIN transactions t ON t.cooperative_id = a.cooperative_id
GROUP BY a.cooperative_id;

CREATE OR REPLACE VIEW public.members_with_age
WITH (security_invoker = true) AS
SELECT
    id,
    cooperative_id,
    member_number,
    first_name,
    last_name,
    birth_date,
    phone,
    address,
    id_type,
    id_number,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_address,
    photo_url,
    status,
    created_at,
    EXTRACT(YEAR FROM AGE(birth_date::timestamptz))::integer AS age
FROM members;
;
