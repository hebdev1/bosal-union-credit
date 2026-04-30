-- ─────────────────────────────────────────────────────────────────────────
-- Refresh helper + triggers
--
-- Trigger funcs run as SECURITY DEFINER so they bypass RLS and can write
-- to credit_scores even when the auth context wouldn't normally have UPDATE.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.refresh_member_credit_score(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s    record;
  v_coop uuid;
begin
  if p_member_id is null then return; end if;

  select cooperative_id into v_coop from public.members where id = p_member_id;
  if v_coop is null then return; end if;

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
$$;

create or replace function public._trg_score_from_payment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.refresh_member_credit_score(coalesce(new.member_id, old.member_id));
  return null;
end;
$$;

create or replace function public._trg_score_from_loan_repayment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_member uuid;
begin
  select l.member_id into v_member
  from public.loans l
  where l.id = coalesce(new.loan_id, old.loan_id);
  if v_member is not null then
    perform public.refresh_member_credit_score(v_member);
  end if;
  return null;
end;
$$;

create or replace function public._trg_score_from_transaction()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_member uuid;
begin
  select a.member_id into v_member
  from public.accounts a
  where a.id = coalesce(new.account_id, old.account_id);
  if v_member is not null then
    perform public.refresh_member_credit_score(v_member);
  end if;
  return null;
end;
$$;

create or replace function public._trg_score_from_member_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.refresh_member_credit_score(new.id);
  return null;
end;
$$;

drop trigger if exists trg_credit_score_payments         on public.payments;
create trigger trg_credit_score_payments
after insert or update or delete on public.payments
for each row execute function public._trg_score_from_payment();

drop trigger if exists trg_credit_score_loan_repayments  on public.loan_repayments;
create trigger trg_credit_score_loan_repayments
after insert or update or delete on public.loan_repayments
for each row execute function public._trg_score_from_loan_repayment();

drop trigger if exists trg_credit_score_transactions     on public.transactions;
create trigger trg_credit_score_transactions
after insert or update or delete on public.transactions
for each row execute function public._trg_score_from_transaction();

drop trigger if exists trg_credit_score_members_insert   on public.members;
create trigger trg_credit_score_members_insert
after insert on public.members
for each row execute function public._trg_score_from_member_insert();

-- One-shot backfill so every existing member gets a row in credit_scores
do $$
declare m record;
begin
  for m in select id from public.members loop
    perform public.refresh_member_credit_score(m.id);
  end loop;
end $$;

comment on function public.refresh_member_credit_score(uuid) is
  'Re-computes a member''s credit score and upserts the result into credit_scores. Called by triggers and the dashboard recalc button.';

-- ─── Security hardening ─────────────────────────────────────────────────
-- Lock search_path on the small touch trigger
create or replace function public._touch_payments_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Strip anon/public from the SECURITY DEFINER helpers; only authenticated
-- agents need to invoke them via RPC. Trigger functions never need a grant
-- because triggers run with the definer's rights, not the caller's role.
revoke all on function public.refresh_member_credit_score(uuid)        from anon, public;
revoke all on function public.calculate_member_credit_score(uuid)      from anon, public;
revoke all on function public._trg_score_from_payment()                from anon, public;
revoke all on function public._trg_score_from_loan_repayment()         from anon, public;
revoke all on function public._trg_score_from_transaction()            from anon, public;
revoke all on function public._trg_score_from_member_insert()          from anon, public;

grant execute on function public.refresh_member_credit_score(uuid)     to authenticated;
grant execute on function public.calculate_member_credit_score(uuid)   to authenticated;
