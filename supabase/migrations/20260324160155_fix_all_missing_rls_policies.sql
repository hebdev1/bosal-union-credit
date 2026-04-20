
-- ══════════════════════════════════════════
-- TABLE: agents  (critique — bloque la connexion)
-- ══════════════════════════════════════════
CREATE POLICY "agents_read_own_coop"
  ON public.agents FOR SELECT
  USING (cooperative_id = get_my_cooperative());

CREATE POLICY "agents_insert_admin"
  ON public.agents FOR INSERT
  WITH CHECK (cooperative_id = get_my_cooperative());

CREATE POLICY "agents_update_admin"
  ON public.agents FOR UPDATE
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: cash_vault
-- ══════════════════════════════════════════
CREATE POLICY "cash_vault_all"
  ON public.cash_vault FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: system_settings
-- ══════════════════════════════════════════
CREATE POLICY "system_settings_all"
  ON public.system_settings FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: shares
-- ══════════════════════════════════════════
CREATE POLICY "shares_all"
  ON public.shares FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: dividends
-- ══════════════════════════════════════════
CREATE POLICY "dividends_all"
  ON public.dividends FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: daily_closings
-- ══════════════════════════════════════════
CREATE POLICY "daily_closings_all"
  ON public.daily_closings FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: branches
-- ══════════════════════════════════════════
CREATE POLICY "branches_all"
  ON public.branches FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: fees
-- ══════════════════════════════════════════
CREATE POLICY "fees_all"
  ON public.fees FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: guarantors
-- ══════════════════════════════════════════
CREATE POLICY "guarantors_all"
  ON public.guarantors FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: documents
-- ══════════════════════════════════════════
CREATE POLICY "documents_all"
  ON public.documents FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: loan_products
-- ══════════════════════════════════════════
CREATE POLICY "loan_products_all"
  ON public.loan_products FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- TABLE: savings_products
-- ══════════════════════════════════════════
CREATE POLICY "savings_products_all"
  ON public.savings_products FOR ALL
  USING (cooperative_id = get_my_cooperative());

-- ══════════════════════════════════════════
-- LEDGER INSERT (manquait le INSERT)
-- ══════════════════════════════════════════
DROP POLICY IF EXISTS "Agents can view ledger of their cooperative" ON public.ledger_entries;
CREATE POLICY "ledger_entries_all"
  ON public.ledger_entries FOR ALL
  USING (cooperative_id = get_my_cooperative());
;
