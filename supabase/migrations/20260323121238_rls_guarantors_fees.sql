
-- =============================================
-- RLS: guarantors
-- =============================================
CREATE POLICY "Agents can view guarantors of their cooperative"
  ON public.guarantors FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Agents can insert guarantors"
  ON public.guarantors FOR INSERT
  WITH CHECK (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins and managers can update guarantors"
  ON public.guarantors FOR UPDATE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

CREATE POLICY "Admins can delete guarantors"
  ON public.guarantors FOR DELETE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ));

-- =============================================
-- RLS: fees
-- =============================================
CREATE POLICY "Agents can view fees of their cooperative"
  ON public.fees FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage fees"
  ON public.fees FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ));
;
