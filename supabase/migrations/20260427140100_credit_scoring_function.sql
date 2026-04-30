-- ─────────────────────────────────────────────────────────────────────────
-- calculate_member_credit_score(p_member_id UUID)
--
-- Pure read function — does NOT write. Returns a single row with all four
-- components, the total (0–1000) and the resulting risk_level bucket.
--
-- Business model:
--   1) Payment behaviour     — max 400  →  ratio(on_time / total) × 400
--   2) Loan repayment        — max 300  →  ratio × 300, then -2 per late day
--   3) Activity              — max 200  →  5 pts per transaction, capped
--   4) Stability             — max 100  →  ≥12 mo: 100 / 6–11 mo: 70 / <6 mo: 40
--
-- Risk buckets:
--   ≥ 800 EXCELLENT  ·  ≥ 600 GOOD  ·  ≥ 400 MEDIUM  ·  < 400 HIGH_RISK
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.calculate_member_credit_score(p_member_id uuid)
returns table (
  payment_score            smallint,
  repayment_score          smallint,
  activity_score           smallint,
  stability_score          smallint,
  total_score              smallint,
  risk_level               text,
  payments_total           int,
  payments_on_time         int,
  loan_repayments_total    int,
  loan_repayments_on_time  int,
  total_late_days          int,
  transactions_count       int,
  months_active            int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payments_total     int := 0;
  v_payments_on_time   int := 0;
  v_payment_ratio      numeric := 0;
  v_payment_score      smallint := 0;

  v_loan_total         int := 0;
  v_loan_on_time       int := 0;
  v_loan_late_days     int := 0;
  v_repayment_ratio    numeric := 0;
  v_repayment_score    smallint := 0;

  v_tx_count           int := 0;
  v_activity_score     smallint := 0;

  v_member_created     timestamptz;
  v_months_active      int := 0;
  v_stability_score    smallint := 0;

  v_total              smallint := 0;
  v_risk               text := 'HIGH_RISK';
begin
  -- 1) Payment behaviour (max 400)
  select
    count(*)::int,
    count(*) filter (
      where status = 'paid'
        and (paid_at is null or paid_at::date <= due_date)
    )::int
  into v_payments_total, v_payments_on_time
  from public.payments
  where member_id = p_member_id
    and status in ('paid','late','missed');

  if v_payments_total > 0 then
    v_payment_ratio := v_payments_on_time::numeric / v_payments_total::numeric;
    v_payment_score := least(400, round(v_payment_ratio * 400))::smallint;
  end if;

  -- 2) Loan repayment behaviour (max 300)
  select
    count(*)::int,
    count(*) filter (
      where lr.status = 'paid'
        and (lr.paid_at is null or lr.paid_at::date <= lr.due_date)
    )::int,
    coalesce(sum(
      case
        when lr.status = 'paid' and lr.paid_at::date > lr.due_date
          then (lr.paid_at::date - lr.due_date)
        when lr.status in ('late','missed','pending') and lr.paid_at is null and lr.due_date < current_date
          then (current_date - lr.due_date)
        else 0
      end
    ), 0)::int
  into v_loan_total, v_loan_on_time, v_loan_late_days
  from public.loan_repayments lr
  join public.loans l on l.id = lr.loan_id
  where l.member_id = p_member_id
    and lr.status in ('paid','late','missed','pending');

  if v_loan_total > 0 then
    v_repayment_ratio := v_loan_on_time::numeric / v_loan_total::numeric;
    v_repayment_score := greatest(
      0,
      least(300, round(v_repayment_ratio * 300) - (v_loan_late_days * 2))
    )::smallint;
  end if;

  -- 3) Activity (max 200)
  select count(*)::int into v_tx_count
  from public.transactions t
  join public.accounts a on a.id = t.account_id
  where a.member_id = p_member_id;

  v_activity_score := least(200, v_tx_count * 5)::smallint;

  -- 4) Stability (max 100)
  select created_at into v_member_created from public.members where id = p_member_id;

  if v_member_created is not null then
    v_months_active := (
      extract(year  from age(now(), v_member_created))::int * 12
      + extract(month from age(now(), v_member_created))::int
    );
  end if;

  v_stability_score := case
    when v_months_active >= 12 then 100
    when v_months_active >= 6  then 70
    else 40
  end;

  -- Total + risk bucket
  v_total := (v_payment_score + v_repayment_score + v_activity_score + v_stability_score)::smallint;

  v_risk := case
    when v_total >= 800 then 'EXCELLENT'
    when v_total >= 600 then 'GOOD'
    when v_total >= 400 then 'MEDIUM'
    else                      'HIGH_RISK'
  end;

  return query select
    v_payment_score,
    v_repayment_score,
    v_activity_score,
    v_stability_score,
    v_total,
    v_risk,
    v_payments_total,
    v_payments_on_time,
    v_loan_total,
    v_loan_on_time,
    v_loan_late_days,
    v_tx_count,
    v_months_active;
end;
$$;

comment on function public.calculate_member_credit_score(uuid) is
  'Computes the 4-component credit score (0-1000) for a member. Pure read; no side effects.';
