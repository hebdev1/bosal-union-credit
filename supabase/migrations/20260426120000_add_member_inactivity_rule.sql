-- ── 1. Setting: member inactivity threshold (days) ─────────────────────────
INSERT INTO app_settings (cooperative_id, category, key, label, value, description, input_type)
SELECT
  id,
  'finance',
  'member_inactivity_days',
  'Jours d''inactivité membre',
  '30'::jsonb,
  'Nombre de jours sans opération avant qu''un membre actif soit automatiquement suspendu (0 = désactivé).',
  'number'
FROM cooperatives
ON CONFLICT (cooperative_id, category, key) DO NOTHING;

-- ── 2. SQL function: deactivate members with no activity for N days ────────
CREATE OR REPLACE FUNCTION deactivate_inactive_members(
  p_cooperative_id uuid,
  p_days integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_threshold timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  IF p_days <= 0 THEN
    RETURN 0;
  END IF;

  WITH last_activity AS (
    -- Members with their most recent activity (tx OR loan OR loan_repayment)
    SELECT m.id AS member_id,
           GREATEST(
             COALESCE(MAX(t.created_at), '-infinity'::timestamptz),
             COALESCE(MAX(l.created_at), '-infinity'::timestamptz),
             COALESCE(MAX(lr.created_at), '-infinity'::timestamptz),
             COALESCE(m.created_at, '-infinity'::timestamptz)
           ) AS last_at
    FROM members m
    LEFT JOIN accounts a       ON a.member_id = m.id
    LEFT JOIN transactions t   ON t.account_id = a.id
    LEFT JOIN loans l          ON l.member_id = m.id
    LEFT JOIN loan_repayments lr ON lr.loan_id = l.id
    WHERE m.cooperative_id = p_cooperative_id
      AND m.status = 'active'
    GROUP BY m.id, m.created_at
  ),
  to_suspend AS (
    SELECT member_id
    FROM last_activity
    WHERE last_at < v_threshold
  )
  UPDATE members
  SET status = 'suspended'
  WHERE id IN (SELECT member_id FROM to_suspend)
    AND cooperative_id = p_cooperative_id
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION deactivate_inactive_members(uuid, integer) TO authenticated;
