
-- =============================================
-- RLS: branches
-- =============================================
CREATE POLICY "Agents can view branches of their cooperative"
  ON public.branches FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage branches"
  ON public.branches FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ));

-- =============================================
-- RLS: daily_closings
-- =============================================
CREATE POLICY "Agents can view daily closings of their cooperative"
  ON public.daily_closings FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Cashiers and managers can create daily closings"
  ON public.daily_closings FOR INSERT
  WITH CHECK (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Managers and admins can update daily closings"
  ON public.daily_closings FOR UPDATE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

CREATE POLICY "Admins can delete daily closings"
  ON public.daily_closings FOR DELETE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ));
;
