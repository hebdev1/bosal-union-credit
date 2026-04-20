
-- =============================================
-- RLS: shares
-- =============================================
CREATE POLICY "Agents can view shares of their cooperative"
  ON public.shares FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Agents can insert shares"
  ON public.shares FOR INSERT
  WITH CHECK (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins and managers can update shares"
  ON public.shares FOR UPDATE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

CREATE POLICY "Admins can delete shares"
  ON public.shares FOR DELETE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ));

-- Members can view their own shares
CREATE POLICY "Members can view their own shares"
  ON public.shares FOR SELECT
  USING (member_id IN (
    SELECT id FROM public.members WHERE id = (
      SELECT id FROM public.members WHERE id::text = auth.uid()::text LIMIT 1
    )
  ));

-- =============================================
-- RLS: dividends
-- =============================================
CREATE POLICY "Agents can view dividends of their cooperative"
  ON public.dividends FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage dividends"
  ON public.dividends FOR ALL
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));
;
