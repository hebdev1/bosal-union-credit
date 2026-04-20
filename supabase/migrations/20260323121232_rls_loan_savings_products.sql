
-- =============================================
-- RLS: loan_products
-- =============================================
CREATE POLICY "Agents can view loan products of their cooperative"
  ON public.loan_products FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage loan products"
  ON public.loan_products FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

-- =============================================
-- RLS: savings_products
-- =============================================
CREATE POLICY "Agents can view savings products of their cooperative"
  ON public.savings_products FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage savings products"
  ON public.savings_products FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));
;
