
-- =============================================
-- RLS: documents
-- =============================================
CREATE POLICY "Agents can view documents of their cooperative"
  ON public.documents FOR SELECT
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Agents can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid()
  ));

CREATE POLICY "Admins and managers can verify documents"
  ON public.documents FOR UPDATE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

CREATE POLICY "Admins can delete documents"
  ON public.documents FOR DELETE
  USING (cooperative_id IN (
    SELECT cooperative_id FROM public.agents WHERE id = auth.uid() AND role = 'admin'
  ));
;
