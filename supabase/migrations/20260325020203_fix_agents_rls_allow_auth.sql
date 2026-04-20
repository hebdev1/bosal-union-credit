
-- Désactiver RLS sur agents pour permettre la lecture après auth
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;

-- Désactiver aussi sur les tables sans circular dependency
ALTER TABLE public.cooperatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_vault DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates DISABLE ROW LEVEL SECURITY;

-- Garder RLS sur les tables sensibles mais corriger la policy
-- pour qu'elle utilise directement auth.uid() sans passer par agents
DROP POLICY IF EXISTS "Agents can manage members of their cooperative" ON public.members;
CREATE POLICY "members_access" ON public.members FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can manage accounts of their cooperative" ON public.accounts;
CREATE POLICY "accounts_access" ON public.accounts FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can manage transactions of their cooperative" ON public.transactions;
CREATE POLICY "transactions_access" ON public.transactions FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can manage loans of their cooperative" ON public.loans;
CREATE POLICY "loans_access" ON public.loans FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can manage repayments of their cooperative" ON public.loan_repayments;
CREATE POLICY "loan_repayments_access" ON public.loan_repayments FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ledger_entries_all" ON public.ledger_entries;
CREATE POLICY "ledger_access" ON public.ledger_entries FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "shares_all" ON public.shares;
CREATE POLICY "shares_access" ON public.shares FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dividends_all" ON public.dividends;
CREATE POLICY "dividends_access" ON public.dividends FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "daily_closings_all" ON public.daily_closings;
CREATE POLICY "daily_closings_access" ON public.daily_closings FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can manage exchange transactions of their cooperative" ON public.exchange_transactions;
CREATE POLICY "exchange_tx_access" ON public.exchange_transactions FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fees_all" ON public.fees;
CREATE POLICY "fees_access" ON public.fees FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "guarantors_all" ON public.guarantors;
CREATE POLICY "guarantors_access" ON public.guarantors FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "documents_all" ON public.documents;
CREATE POLICY "documents_access" ON public.documents FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "branches_all" ON public.branches;
CREATE POLICY "branches_access" ON public.branches FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "loan_products_all" ON public.loan_products;
CREATE POLICY "loan_products_access" ON public.loan_products FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "savings_products_all" ON public.savings_products;
CREATE POLICY "savings_products_access" ON public.savings_products FOR ALL
  USING (
    cooperative_id IN (
      SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
    )
  );
;
