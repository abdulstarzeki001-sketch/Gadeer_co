
-- 1. Create private schema and move has_role helper out of API exposure
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Drop public.has_role (CASCADE removes policies that reference it; recreated below)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

-- 3. Companies: tighten always-true policies to admin-only
DROP POLICY IF EXISTS "auth insert companies" ON public.companies;
DROP POLICY IF EXISTS "auth update companies" ON public.companies;
DROP POLICY IF EXISTS "auth delete companies" ON public.companies;

CREATE POLICY "admin insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete companies" ON public.companies
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- 4. Recreate policies on documents that used has_role
CREATE POLICY "owner or admin update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- 5. document_items
CREATE POLICY "auth insert items" ON public.document_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_items.document_id
      AND ((d.created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "owner or admin update items" ON public.document_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_items.document_id
      AND ((d.created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_items.document_id
      AND ((d.created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "owner or admin delete items" ON public.document_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_items.document_id
      AND ((d.created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  ));

-- 6. traders
CREATE POLICY "owner or admin update traders" ON public.traders
  FOR UPDATE TO authenticated
  USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete traders" ON public.traders
  FOR DELETE TO authenticated
  USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

-- 7. transactions
CREATE POLICY "owner or admin update tx" ON public.transactions
  FOR UPDATE TO authenticated
  USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete tx" ON public.transactions
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- 8. Remove SECURITY DEFINER functions exposed via the public API that are unused
DROP FUNCTION IF EXISTS public.verify_document(text);
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
