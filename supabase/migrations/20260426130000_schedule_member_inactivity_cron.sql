-- ── 1. Enable pg_cron (job scheduler) ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── 2. Wrapper function: deactivate inactive members for ALL cooperatives ──
-- Reads each cooperative's `member_inactivity_days` setting (default 30) and
-- calls deactivate_inactive_members(coop_id, days). Designed to be called by
-- a daily cron job; safe & idempotent (no-ops if days <= 0).
CREATE OR REPLACE FUNCTION run_inactivity_deactivation_for_all()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_coop record;
  v_days integer;
  v_count integer;
  v_total integer := 0;
BEGIN
  FOR v_coop IN SELECT id FROM cooperatives LOOP
    BEGIN
      SELECT NULLIF(trim(both '"' from value::text), '')::int
        INTO v_days
        FROM app_settings
        WHERE cooperative_id = v_coop.id
          AND category = 'finance'
          AND key    = 'member_inactivity_days'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_days := 30;
    END;

    IF v_days IS NULL THEN
      v_days := 30;
    END IF;

    IF v_days > 0 THEN
      v_count := public.deactivate_inactive_members(v_coop.id, v_days);
      v_total := v_total + COALESCE(v_count, 0);
    END IF;
  END LOOP;

  RETURN v_total;
END;
$func$;

GRANT EXECUTE ON FUNCTION run_inactivity_deactivation_for_all() TO authenticated;

-- ── 3. Schedule the daily cron job (03:00 UTC) ─────────────────────────────
-- Idempotent: unschedule any prior version of the same-named job first.
DO $sched$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'member-inactivity-daily';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;

  PERFORM cron.schedule(
    'member-inactivity-daily',
    '0 3 * * *',
    $cmd$SELECT public.run_inactivity_deactivation_for_all();$cmd$
  );
END
$sched$;
