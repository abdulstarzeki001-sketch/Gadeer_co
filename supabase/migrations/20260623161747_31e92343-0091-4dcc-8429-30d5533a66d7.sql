
-- Tighten SELECT policies: only creator or admin can read sensitive data
DROP POLICY IF EXISTS "auth read documents" ON public.documents;
CREATE POLICY "owner or admin read documents" ON public.documents
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "auth read traders" ON public.traders;
CREATE POLICY "owner or admin read traders" ON public.traders
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "auth read tx" ON public.transactions;
CREATE POLICY "owner or admin read tx" ON public.transactions
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "auth read items" ON public.document_items;
CREATE POLICY "owner or admin read items" ON public.document_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_items.document_id
      AND (d.created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role))
  ));
