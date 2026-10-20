-- ─────────────────────────────────────────────────────────────────────────
-- Security: lock down EXECUTE on public functions (audit 2026-10-19, P0)
--
-- Live state before this migration: 21 SECURITY DEFINER functions were
-- executable by PUBLIC/anon (GRANT ALL ON ALL ROUTINES, migration
-- 20260325020531). None checked the caller, so the public anon key could
-- call increment_vault, set_exchange_rate, update_setting,
-- run_inactivity_deactivation_for_all… through /rest/v1/rpc.
--
-- After: nobody but the owner (postgres, used by pg_cron and triggers) and
-- service_role can execute them, except the 3 functions the app or the RLS
-- policies actually call. Trigger functions do not need EXECUTE at fire
-- time, and nested calls from SECURITY DEFINER triggers run as the owner.
-- ─────────────────────────────────────────────────────────────────────────

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

-- Allow-list for authenticated agents
grant execute on function public.get_my_cooperative()                       to authenticated; -- used by RLS policies
grant execute on function public.refresh_member_credit_score(uuid)          to authenticated; -- membres/actions.ts recalc button
grant execute on function public.deactivate_inactive_members(uuid, integer) to authenticated; -- parametres/actions.ts

-- New functions created by this role no longer get implicit EXECUTE
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
