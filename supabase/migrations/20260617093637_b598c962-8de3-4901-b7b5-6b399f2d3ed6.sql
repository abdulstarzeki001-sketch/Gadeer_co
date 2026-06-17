
DROP POLICY IF EXISTS "auth insert documents" ON public.documents;
CREATE POLICY "auth insert documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "auth insert tx" ON public.transactions;
CREATE POLICY "auth insert tx" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "auth insert items" ON public.document_items;
CREATE POLICY "auth insert items" ON public.document_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_items.document_id
        AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
