
-- 1. Tighten documents SELECT (remove anonymous public access)
DROP POLICY IF EXISTS "anyone verify documents" ON public.documents;
CREATE POLICY "auth read documents" ON public.documents
  FOR SELECT TO authenticated USING (true);

-- 2. Tighten document_items SELECT
DROP POLICY IF EXISTS "anyone view items" ON public.document_items;
CREATE POLICY "auth read items" ON public.document_items
  FOR SELECT TO authenticated USING (true);

-- 3. Tighten UPDATE policies (no more USING true)
DROP POLICY IF EXISTS "auth update documents" ON public.documents;
CREATE POLICY "owner or admin update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "auth update items" ON public.document_items;
CREATE POLICY "owner or admin update items" ON public.document_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_items.document_id
        AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_items.document_id
        AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "auth delete items" ON public.document_items;
CREATE POLICY "owner or admin delete items" ON public.document_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_items.document_id
        AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "auth update tx" ON public.transactions;
CREATE POLICY "owner or admin update tx" ON public.transactions
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 4. Companies: writes restricted to admins
DROP POLICY IF EXISTS "auth insert companies" ON public.companies;
CREATE POLICY "admin insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "auth update companies" ON public.companies;
CREATE POLICY "admin update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Public verification RPC (only safe fields, scoped to one document_number)
CREATE OR REPLACE FUNCTION public.verify_document(doc_number text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', d.id,
    'document_number', d.document_number,
    'company_name', d.company_name,
    'company_name_project', d.company_name_project,
    'subject', d.subject,
    'brand', d.brand,
    'governorate_name', d.governorate_name,
    'destination_governorate', d.destination_governorate,
    'cargo_typedetails', d.cargo_typedetails,
    'weight_quantity', d.weight_quantity,
    'license_text_specialization', d.license_text_specialization,
    'granting_license_approval', d.granting_license_approval,
    'license_approval_number', d.license_approval_number,
    'license_approval_date', d.license_approval_date,
    'notes', d.notes,
    'qr_code_data', d.qr_code_data,
    'status', d.status,
    'created_at', d.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'item_name', i.item_name,
        'unit', i.unit,
        'production_capacity', i.production_capacity
      ))
      FROM public.document_items i WHERE i.document_id = d.id
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.documents d
  WHERE d.document_number = doc_number
  LIMIT 1;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_document(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_document(text) TO anon, authenticated;

-- 6. Harden existing functions
CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  n  BIGINT := nextval('public.document_number_seq');
BEGIN
  RETURN yr || '-' || lpad(n::text, 6, '0');
END;
$$;

-- Restrict execute on sensitive/internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_document_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_document_number() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
