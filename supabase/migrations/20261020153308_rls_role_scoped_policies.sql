-- ─────────────────────────────────────────────────────────────────────────
-- RLS: role-scoped writes, working audit trail, suspended agents cut off
-- (audit 2026-10-19 — P1 findings)
--
--  * get_my_cooperative() / get_my_role() ignore suspended or closed agents,
--    so suspending an agent really removes their access.
--  * agents: only an admin can insert or update agent rows (a cashier could
--    previously set role='admin' on themselves through PostgREST).
--  * cooperatives: admins can update their cooperative (updateCooperative
--    was a silent no-op: no UPDATE policy existed).
--  * app_settings / exchange_rates / system_settings: everyone in the coop
--    reads, only admin/manager write.
--  * cash_vault: read-only for agents; the SECURITY DEFINER trigger
--    trg_sync_vault is the single writer (fixes the double application).
--  * transactions: agents insert into accounts of their own coop only;
--    update/delete reserved to admins.
--  * audit_logs / fraud_flags: INSERT policies so logAudit() and the app
--    fraud rules stop being silently rejected (audit_logs had 0 rows).
--  * credit_scores: drop the admin policy that was not coop-scoped.
--  * profiles / customers: replace the self-referencing policy (42P17).
--  * Grants: anon loses every table/sequence privilege (RLS already returned
--    0 rows); authenticated loses TRUNCATE/REFERENCES/TRIGGER.
--  * Storage 'logos': writes limited to admin/manager inside their
--    cooperative folder; SVG removed from allowed types.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── 1. Helpers ────────────────────────────────────────────────────────────
create or replace function public.get_my_cooperative()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select cooperative_id
  from public.agents
  where id = auth.uid()
    and coalesce(status::text, 'active') not in ('suspended', 'closed')
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role::text
  from public.agents
  where id = auth.uid()
    and coalesce(status::text, 'active') not in ('suspended', 'closed')
$$;

revoke execute on function public.get_my_role() from public;
revoke execute on function public.get_my_role() from anon;
grant  execute on function public.get_my_role() to authenticated;

-- ─── 2. agents ─────────────────────────────────────────────────────────────
drop policy if exists agents_update_admin on public.agents;
create policy agents_update_admin on public.agents
  for update to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin')
  with check (cooperative_id = (select public.get_my_cooperative()));

drop policy if exists agents_insert_admin on public.agents;
create policy agents_insert_admin on public.agents
  for insert to authenticated
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin');

-- ─── 3. cooperatives ───────────────────────────────────────────────────────
drop policy if exists cooperatives_update_admin on public.cooperatives;
create policy cooperatives_update_admin on public.cooperatives
  for update to authenticated
  using      (id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin')
  with check (id = (select public.get_my_cooperative()));

-- ─── 4. app_settings ───────────────────────────────────────────────────────
drop policy if exists app_settings_access on public.app_settings;
drop policy if exists app_settings_select on public.app_settings;
drop policy if exists app_settings_write  on public.app_settings;
create policy app_settings_select on public.app_settings
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));
create policy app_settings_write on public.app_settings
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'))
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'));

-- ─── 5. exchange_rates ─────────────────────────────────────────────────────
drop policy if exists exchange_rates_access on public.exchange_rates;
drop policy if exists exchange_rates_select on public.exchange_rates;
drop policy if exists exchange_rates_write  on public.exchange_rates;
create policy exchange_rates_select on public.exchange_rates
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));
create policy exchange_rates_write on public.exchange_rates
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'))
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) in ('admin', 'manager'));

-- ─── 6. system_settings (unused by the app today) ──────────────────────────
drop policy if exists system_settings_all    on public.system_settings;
drop policy if exists system_settings_select on public.system_settings;
drop policy if exists system_settings_write  on public.system_settings;
create policy system_settings_select on public.system_settings
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));
create policy system_settings_write on public.system_settings
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin')
  with check (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin');

-- ─── 7. cash_vault: read-only, the trigger is the only writer ──────────────
drop policy if exists cash_vault_all    on public.cash_vault;
drop policy if exists cash_vault_select on public.cash_vault;
create policy cash_vault_select on public.cash_vault
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));

-- ─── 8. transactions ───────────────────────────────────────────────────────
drop policy if exists transactions_access       on public.transactions;
drop policy if exists transactions_select       on public.transactions;
drop policy if exists transactions_insert       on public.transactions;
drop policy if exists transactions_update_admin on public.transactions;
drop policy if exists transactions_delete_admin on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (cooperative_id = (select public.get_my_cooperative()));
create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (
    cooperative_id = (select public.get_my_cooperative())
    and exists (
      select 1 from public.accounts a
      where a.id = account_id
        and a.cooperative_id = (select public.get_my_cooperative())
    )
  );
create policy transactions_update_admin on public.transactions
  for update to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin')
  with check (cooperative_id = (select public.get_my_cooperative()));
create policy transactions_delete_admin on public.transactions
  for delete to authenticated
  using (cooperative_id = (select public.get_my_cooperative()) and (select public.get_my_role()) = 'admin');

-- ─── 9. audit_logs / fraud_flags: allow the app to write ───────────────────
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    cooperative_id = (select public.get_my_cooperative())
    and (user_id is null or user_id = (select auth.uid()))
  );

drop policy if exists fraud_flags_insert on public.fraud_flags;
create policy fraud_flags_insert on public.fraud_flags
  for insert to authenticated
  with check (cooperative_id = (select public.get_my_cooperative()));

-- ─── 10. credit_scores: drop the cross-tenant admin policy ─────────────────
drop policy if exists credit_scores_admin_select on public.credit_scores;

-- ─── 11. profiles / customers: remove self-referencing recursion ───────────
drop policy if exists coop_isolation_profiles on public.profiles;
create policy coop_isolation_profiles on public.profiles
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()))
  with check (cooperative_id = (select public.get_my_cooperative()));

drop policy if exists coop_isolation_customers on public.customers;
create policy coop_isolation_customers on public.customers
  for all to authenticated
  using      (cooperative_id = (select public.get_my_cooperative()))
  with check (cooperative_id = (select public.get_my_cooperative()));

-- ─── 12. Grants (defence in depth — RLS already denied anon) ───────────────
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- Backup snapshots from the wipe script: never reachable through the API
revoke all on public.backup_members, public.backup_accounts, public.backup_payments,
              public.backup_loans, public.backup_loan_repayments,
              public.backup_transactions, public.backup_credit_scores,
              public.backup_exchange_rates
  from authenticated;

-- ─── 13. Storage 'logos' ───────────────────────────────────────────────────
drop policy if exists logos_insert_authenticated on storage.objects;
drop policy if exists logos_update_authenticated on storage.objects;
drop policy if exists logos_delete_authenticated on storage.objects;
drop policy if exists logos_select_public        on storage.objects;
drop policy if exists logos_select_own_coop      on storage.objects;
drop policy if exists logos_insert_own_coop      on storage.objects;
drop policy if exists logos_update_own_coop      on storage.objects;
drop policy if exists logos_delete_own_coop      on storage.objects;

-- Public URLs keep working: 'logos' is a public bucket, downloads by URL do
-- not go through RLS. These policies only govern API list/upload/delete.
create policy logos_select_own_coop on storage.objects
  for select to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select public.get_my_cooperative())::text
  );
create policy logos_insert_own_coop on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select public.get_my_cooperative())::text
    and (select public.get_my_role()) in ('admin', 'manager')
  );
create policy logos_update_own_coop on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select public.get_my_cooperative())::text
    and (select public.get_my_role()) in ('admin', 'manager')
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select public.get_my_cooperative())::text
  );
create policy logos_delete_own_coop on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select public.get_my_cooperative())::text
    and (select public.get_my_role()) in ('admin', 'manager')
  );

update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
 where id = 'logos';
