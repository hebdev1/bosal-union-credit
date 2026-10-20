-- ─────────────────────────────────────────────────────────────────────────
-- Caller checks inside the SECURITY DEFINER functions agents may still call
-- (audit 2026-10-19)
--
-- Rule: when a JWT is present (auth.uid() not null) the caller must belong
-- to the target cooperative. When no JWT is present the call comes from
-- inside the database (pg_cron as postgres, triggers, migrations) — anon
-- and authenticated cannot reach these functions without a JWT because
-- EXECUTE is revoked from anon/PUBLIC.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── deactivate_inactive_members: admin/manager of the same coop only ──────
create or replace function public.deactivate_inactive_members(p_cooperative_id uuid, p_days integer)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_count integer := 0;
  v_threshold timestamptz := now() - (p_days || ' days')::interval;
begin
  if auth.uid() is not null then
    if p_cooperative_id is distinct from public.get_my_cooperative()
       or coalesce(public.get_my_role(), '') not in ('admin', 'manager') then
      raise exception 'Accès refusé' using errcode = '42501';
    end if;
  end if;

  if p_days <= 0 then
    return 0;
  end if;

  with last_activity as (
    select m.id as member_id,
           greatest(
             coalesce(max(t.created_at), '-infinity'::timestamptz),
             coalesce(max(l.created_at), '-infinity'::timestamptz),
             coalesce(max(lr.created_at), '-infinity'::timestamptz),
             coalesce(m.created_at, '-infinity'::timestamptz)
           ) as last_at
    from members m
    left join accounts a         on a.member_id = m.id
    left join transactions t     on t.account_id = a.id
    left join loans l            on l.member_id = m.id
    left join loan_repayments lr on lr.loan_id = l.id
    where m.cooperative_id = p_cooperative_id
      and m.status = 'active'
    group by m.id, m.created_at
  ),
  to_suspend as (
    select member_id from last_activity where last_at < v_threshold
  )
  update members
     set status = 'suspended'
   where id in (select member_id from to_suspend)
     and cooperative_id = p_cooperative_id
     and status = 'active';

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- ─── refresh_member_credit_score: member must belong to caller's coop ──────
create or replace function public.refresh_member_credit_score(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  s      record;
  v_coop uuid;
begin
  if p_member_id is null then return; end if;

  select cooperative_id into v_coop from public.members where id = p_member_id;
  if v_coop is null then return; end if;

  if auth.uid() is not null and v_coop is distinct from public.get_my_cooperative() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  select * into s from public.calculate_member_credit_score(p_member_id);

  insert into public.credit_scores (
    member_id, cooperative_id,
    payment_score, repayment_score, activity_score, stability_score,
    total_score,  risk_level,
    payments_total, payments_on_time,
    loan_repayments_total, loan_repayments_on_time, total_late_days,
    transactions_count, months_active,
    last_calculated_at
  ) values (
    p_member_id, v_coop,
    s.payment_score, s.repayment_score, s.activity_score, s.stability_score,
    s.total_score,  s.risk_level,
    s.payments_total, s.payments_on_time,
    s.loan_repayments_total, s.loan_repayments_on_time, s.total_late_days,
    s.transactions_count, s.months_active,
    now()
  )
  on conflict (member_id) do update set
    payment_score            = excluded.payment_score,
    repayment_score          = excluded.repayment_score,
    activity_score           = excluded.activity_score,
    stability_score          = excluded.stability_score,
    total_score              = excluded.total_score,
    risk_level               = excluded.risk_level,
    payments_total           = excluded.payments_total,
    payments_on_time         = excluded.payments_on_time,
    loan_repayments_total    = excluded.loan_repayments_total,
    loan_repayments_on_time  = excluded.loan_repayments_on_time,
    total_late_days          = excluded.total_late_days,
    transactions_count       = excluded.transactions_count,
    months_active            = excluded.months_active,
    last_calculated_at       = now();
end;
$function$;

-- ─── detect_fraud_func: night rule evaluated in Haiti local time ───────────
-- created_at was read in UTC, so 23h–4h UTC flagged Haitian evenings
-- (almost every live flag was 'Suspicious night activity').
create or replace function public.detect_fraud_func()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_recent_count integer;
  v_hour         integer;
begin
  -- Rule 1: high frequency (> 5 transactions in 5 minutes on the same account)
  select count(*) into v_recent_count
  from transactions
  where account_id = new.account_id
    and created_at > now() - interval '5 minutes';

  if v_recent_count > 5 then
    insert into fraud_flags (cooperative_id, transaction_id, rule_triggered, severity)
    values (new.cooperative_id, new.id, 'High frequency transactions', 'high');
  end if;

  -- Rule 2: night activity (23h–4h, Haiti local time)
  v_hour := extract(hour from (coalesce(new.created_at, now()) at time zone 'America/Port-au-Prince'));
  if v_hour >= 23 or v_hour <= 4 then
    insert into fraud_flags (cooperative_id, transaction_id, rule_triggered, severity)
    values (new.cooperative_id, new.id, 'Suspicious night activity', 'low');
  end if;

  return new;
end;
$function$;

-- create or replace keeps the ACLs, re-assert them anyway
revoke execute on function public.deactivate_inactive_members(uuid, integer) from public, anon;
revoke execute on function public.refresh_member_credit_score(uuid)          from public, anon;
revoke execute on function public.detect_fraud_func()                         from public, anon, authenticated;
grant  execute on function public.deactivate_inactive_members(uuid, integer) to authenticated;
grant  execute on function public.refresh_member_credit_score(uuid)          to authenticated;
