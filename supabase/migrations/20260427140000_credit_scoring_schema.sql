-- ─────────────────────────────────────────────────────────────────────────
-- CREDIT SCORING ENGINE — schema
-- Adds:
--   1) public.payments          (member contributions / dues w/ schedule)
--   2) public.credit_scores     (cached score per member, 1:1)
-- Plus indexes for hot read paths and RLS policies (cooperative-scoped).
-- ─────────────────────────────────────────────────────────────────────────

-- ─── 1. payments ─────────────────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  cooperative_id  uuid not null references public.cooperatives(id) on delete cascade,
  member_id       uuid not null references public.members(id)      on delete cascade,
  agent_id        uuid          references public.agents(id)       on delete set null,
  reference       text,
  amount          numeric(14,2) not null default 0  check (amount      >= 0),
  amount_due      numeric(14,2) not null            check (amount_due  >= 0),
  due_date        date          not null,
  paid_at         timestamptz,
  status          text          not null default 'pending'
                  check (status in ('pending','paid','late','missed','cancelled')),
  category        text,
  notes           text,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index if not exists idx_payments_member_id        on public.payments(member_id);
create index if not exists idx_payments_member_status    on public.payments(member_id, status);
create index if not exists idx_payments_member_due_date  on public.payments(member_id, due_date);
create index if not exists idx_payments_cooperative_id   on public.payments(cooperative_id);
create index if not exists idx_payments_status_due       on public.payments(status, due_date);

create or replace function public._touch_payments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_payments_updated_at on public.payments;
create trigger trg_touch_payments_updated_at
before update on public.payments
for each row execute function public._touch_payments_updated_at();

-- ─── 2. credit_scores ────────────────────────────────────────────────────
create table if not exists public.credit_scores (
  id                       uuid primary key default gen_random_uuid(),
  member_id                uuid not null unique
                                 references public.members(id) on delete cascade,
  cooperative_id           uuid not null
                                 references public.cooperatives(id) on delete cascade,
  payment_score            smallint not null default 0 check (payment_score    between 0 and 400),
  repayment_score          smallint not null default 0 check (repayment_score  between 0 and 300),
  activity_score           smallint not null default 0 check (activity_score   between 0 and 200),
  stability_score          smallint not null default 0 check (stability_score  between 0 and 100),
  total_score              smallint not null default 0 check (total_score      between 0 and 1000),
  risk_level               text     not null default 'HIGH_RISK'
                           check (risk_level in ('EXCELLENT','GOOD','MEDIUM','HIGH_RISK')),
  payments_total           int      not null default 0,
  payments_on_time         int      not null default 0,
  loan_repayments_total    int      not null default 0,
  loan_repayments_on_time  int      not null default 0,
  total_late_days          int      not null default 0,
  transactions_count       int      not null default 0,
  months_active            int      not null default 0,
  last_calculated_at       timestamptz not null default now(),
  created_at               timestamptz not null default now()
);

create index if not exists idx_credit_scores_cooperative_id on public.credit_scores(cooperative_id);
create index if not exists idx_credit_scores_total_desc     on public.credit_scores(total_score desc);
create index if not exists idx_credit_scores_risk_level     on public.credit_scores(risk_level);

-- ─── 3. RLS — cooperative-scoped, with admin override ───────────────────
alter table public.payments      enable row level security;
alter table public.credit_scores enable row level security;

drop policy if exists "payments_agent_select"   on public.payments;
drop policy if exists "payments_agent_write"    on public.payments;
create policy "payments_agent_select"
on public.payments for select
using (
  cooperative_id in (
    select cooperative_id from public.agents where id = (select auth.uid())
  )
);
create policy "payments_agent_write"
on public.payments for all
using (
  cooperative_id in (
    select cooperative_id from public.agents where id = (select auth.uid())
  )
)
with check (
  cooperative_id in (
    select cooperative_id from public.agents where id = (select auth.uid())
  )
);

drop policy if exists "credit_scores_agent_select" on public.credit_scores;
drop policy if exists "credit_scores_admin_select" on public.credit_scores;
drop policy if exists "credit_scores_agent_write"  on public.credit_scores;

create policy "credit_scores_agent_select"
on public.credit_scores for select
using (
  cooperative_id in (
    select cooperative_id from public.agents where id = (select auth.uid())
  )
);

create policy "credit_scores_admin_select"
on public.credit_scores for select
using (
  exists (
    select 1 from public.agents
    where id = (select auth.uid()) and role = 'admin'
  )
);

create policy "credit_scores_agent_write"
on public.credit_scores for all
using (
  cooperative_id in (
    select cooperative_id from public.agents where id = (select auth.uid())
  )
)
with check (
  cooperative_id in (
    select cooperative_id from public.agents where id = (select auth.uid())
  )
);

comment on table public.payments is
  'Member contributions / dues with a schedule — feeds the « Payment behaviour » component of the credit score.';
comment on table public.credit_scores is
  'Cached credit score per member (0–1000). Refreshed automatically by triggers on payments, loan_repayments, and transactions.';
