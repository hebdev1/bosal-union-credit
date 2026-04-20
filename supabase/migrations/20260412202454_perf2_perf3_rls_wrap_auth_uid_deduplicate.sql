
-- ============================================================
-- PERF 2 : Remplacer auth.uid() par (SELECT auth.uid()) dans
--          toutes les politiques RLS → évaluation unique par
--          requête au lieu de par ligne (init-plan vs re-eval)
-- PERF 3 : Fusionner les 2 politiques en double sur exchange_rates
-- ============================================================

-- ── exchange_rates ──────────────────────────────────────────
-- PERF 3 : supprimer la politique redondante
DROP POLICY IF EXISTS "Agents can manage exchange rates of their cooperative"
    ON public.exchange_rates;

DROP POLICY IF EXISTS exchange_rates_access ON public.exchange_rates;
CREATE POLICY exchange_rates_access ON public.exchange_rates
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── accounts ────────────────────────────────────────────────
DROP POLICY IF EXISTS accounts_access ON public.accounts;
CREATE POLICY accounts_access ON public.accounts
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── app_settings ────────────────────────────────────────────
DROP POLICY IF EXISTS app_settings_access ON public.app_settings;
CREATE POLICY app_settings_access ON public.app_settings
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── branches ────────────────────────────────────────────────
DROP POLICY IF EXISTS branches_access ON public.branches;
CREATE POLICY branches_access ON public.branches
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── daily_closings ──────────────────────────────────────────
DROP POLICY IF EXISTS daily_closings_access ON public.daily_closings;
CREATE POLICY daily_closings_access ON public.daily_closings
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── dividends ───────────────────────────────────────────────
DROP POLICY IF EXISTS dividends_access ON public.dividends;
CREATE POLICY dividends_access ON public.dividends
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── documents ───────────────────────────────────────────────
DROP POLICY IF EXISTS documents_access ON public.documents;
CREATE POLICY documents_access ON public.documents
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── exchange_transactions ───────────────────────────────────
DROP POLICY IF EXISTS exchange_tx_access ON public.exchange_transactions;
CREATE POLICY exchange_tx_access ON public.exchange_transactions
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── fees ────────────────────────────────────────────────────
DROP POLICY IF EXISTS fees_access ON public.fees;
CREATE POLICY fees_access ON public.fees
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── guarantors ──────────────────────────────────────────────
DROP POLICY IF EXISTS guarantors_access ON public.guarantors;
CREATE POLICY guarantors_access ON public.guarantors
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── ledger_entries ──────────────────────────────────────────
DROP POLICY IF EXISTS ledger_access ON public.ledger_entries;
CREATE POLICY ledger_access ON public.ledger_entries
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── loan_products ───────────────────────────────────────────
DROP POLICY IF EXISTS loan_products_access ON public.loan_products;
CREATE POLICY loan_products_access ON public.loan_products
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── loan_repayments ─────────────────────────────────────────
DROP POLICY IF EXISTS loan_repayments_access ON public.loan_repayments;
CREATE POLICY loan_repayments_access ON public.loan_repayments
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── loans ───────────────────────────────────────────────────
DROP POLICY IF EXISTS loans_access ON public.loans;
CREATE POLICY loans_access ON public.loans
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── members ─────────────────────────────────────────────────
DROP POLICY IF EXISTS members_access ON public.members;
CREATE POLICY members_access ON public.members
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── savings_products ────────────────────────────────────────
DROP POLICY IF EXISTS savings_products_access ON public.savings_products;
CREATE POLICY savings_products_access ON public.savings_products
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── settings_logs ───────────────────────────────────────────
DROP POLICY IF EXISTS settings_logs_access ON public.settings_logs;
CREATE POLICY settings_logs_access ON public.settings_logs
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── shares ──────────────────────────────────────────────────
DROP POLICY IF EXISTS shares_access ON public.shares;
CREATE POLICY shares_access ON public.shares
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── transactions ────────────────────────────────────────────
DROP POLICY IF EXISTS transactions_access ON public.transactions;
CREATE POLICY transactions_access ON public.transactions
    FOR ALL TO public
    USING (cooperative_id IN (
        SELECT agents.cooperative_id FROM agents
        WHERE agents.id = (SELECT auth.uid())
    ));

-- ── customers (pattern profiles) ────────────────────────────
DROP POLICY IF EXISTS coop_isolation_customers ON public.customers;
CREATE POLICY coop_isolation_customers ON public.customers
    FOR ALL TO public
    USING (cooperative_id = (
        SELECT profiles.cooperative_id FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
    ));

-- ── profiles (auto-jointure) ────────────────────────────────
DROP POLICY IF EXISTS coop_isolation_profiles ON public.profiles;
CREATE POLICY coop_isolation_profiles ON public.profiles
    FOR ALL TO public
    USING (cooperative_id = (
        SELECT p.cooperative_id FROM profiles p
        WHERE p.id = (SELECT auth.uid())
    ));

-- ── internal_messages (deux auth.uid()) ─────────────────────
DROP POLICY IF EXISTS "Agents can manage their messages" ON public.internal_messages;
CREATE POLICY "Agents can manage their messages" ON public.internal_messages
    FOR ALL TO public
    USING (
        cooperative_id = get_my_cooperative()
        AND (
            sender_agent_id   = (SELECT auth.uid())
            OR receiver_agent_id = (SELECT auth.uid())
        )
    );
;
