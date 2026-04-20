
-- ============================================================
-- PERF 1 : Index sur les 20 foreign keys manquants
-- Note : CONCURRENTLY retiré car incompatible avec les
--        transactions de migration (erreur PostgreSQL).
--        IF NOT EXISTS garantit l'idempotence.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agents_cooperative_id
    ON public.agents(cooperative_id);

CREATE INDEX IF NOT EXISTS idx_loans_member_id
    ON public.loans(member_id);

CREATE INDEX IF NOT EXISTS idx_loans_account_id
    ON public.loans(account_id);

CREATE INDEX IF NOT EXISTS idx_loans_agent_id
    ON public.loans(agent_id);

CREATE INDEX IF NOT EXISTS idx_loans_loan_product_id
    ON public.loans(loan_product_id);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_agent_id
    ON public.loan_repayments(agent_id);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_cooperative_id
    ON public.loan_repayments(cooperative_id);

CREATE INDEX IF NOT EXISTS idx_transactions_agent_id
    ON public.transactions(agent_id);

CREATE INDEX IF NOT EXISTS idx_shares_member_id
    ON public.shares(member_id);

CREATE INDEX IF NOT EXISTS idx_dividends_member_id
    ON public.dividends(member_id);

CREATE INDEX IF NOT EXISTS idx_dividends_cooperative_id
    ON public.dividends(cooperative_id);

CREATE INDEX IF NOT EXISTS idx_dividends_agent_id
    ON public.dividends(agent_id);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_agent_id
    ON public.exchange_rates(set_by_agent_id);

CREATE INDEX IF NOT EXISTS idx_exchange_transactions_rate_id
    ON public.exchange_transactions(exchange_rate_id);

CREATE INDEX IF NOT EXISTS idx_guarantors_loan_id
    ON public.guarantors(loan_id);

CREATE INDEX IF NOT EXISTS idx_daily_closings_branch_id
    ON public.daily_closings(branch_id);

CREATE INDEX IF NOT EXISTS idx_settings_logs_agent_id
    ON public.settings_logs(agent_id);

CREATE INDEX IF NOT EXISTS idx_settings_logs_cooperative_id
    ON public.settings_logs(cooperative_id);

CREATE INDEX IF NOT EXISTS idx_app_settings_updated_by
    ON public.app_settings(updated_by);

CREATE INDEX IF NOT EXISTS idx_customers_user_id
    ON public.customers(user_id);
;
