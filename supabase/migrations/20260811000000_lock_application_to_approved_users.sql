-- Authorization allow-list for production application access.
-- Provision the approved immutable auth.users UUID with the service role or
-- Supabase SQL editor after this migration:
--   INSERT INTO private.approved_users (user_id) VALUES ('<auth-user-uuid>');

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.approved_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.approved_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.approved_users FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.approved_users TO service_role;

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.approved_users
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_approved_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_user() TO authenticated, service_role;

DO $$
DECLARE
  v_table_name text;
  v_policy_name text;
BEGIN
  FOREACH v_table_name IN ARRAY ARRAY[
    'companies',
    'document_items',
    'documents',
    'traders',
    'transactions',
    'accounts',
    'user_roles'
  ]
  LOOP
    IF to_regclass(format('public.%I', v_table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', v_table_name);

    FOR v_policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', v_policy_name, v_table_name);
    END LOOP;

    -- Keep the row-level ownership boundaries established by earlier migrations;
    -- approval is an additional gate, not a replacement for those boundaries.
    IF v_table_name = 'companies' THEN
      EXECUTE 'CREATE POLICY approved_user_access ON public.companies FOR ALL TO authenticated USING (public.is_approved_user() AND public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.is_approved_user() AND public.has_role(auth.uid(), ''admin''::app_role))';
    ELSIF v_table_name = 'user_roles' THEN
      EXECUTE 'CREATE POLICY approved_user_access ON public.user_roles FOR ALL TO authenticated USING (public.is_approved_user() AND (user_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role))) WITH CHECK (public.is_approved_user() AND (user_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role)))';
    ELSIF v_table_name = 'accounts' THEN
      EXECUTE 'CREATE POLICY approved_user_access ON public.accounts FOR ALL TO authenticated USING (public.is_approved_user() AND (user_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role))) WITH CHECK (public.is_approved_user() AND (user_id = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role)))';
    ELSIF v_table_name = 'document_items' THEN
      EXECUTE 'CREATE POLICY approved_user_access ON public.document_items FOR ALL TO authenticated USING (public.is_approved_user() AND (public.has_role(auth.uid(), ''admin''::app_role) OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_items.document_id AND d.created_by = auth.uid()))) WITH CHECK (public.is_approved_user() AND (public.has_role(auth.uid(), ''admin''::app_role) OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_items.document_id AND d.created_by = auth.uid())))';
    ELSE
      EXECUTE format('CREATE POLICY approved_user_access ON public.%I FOR ALL TO authenticated USING (public.is_approved_user() AND (created_by = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role))) WITH CHECK (public.is_approved_user() AND (created_by = auth.uid() OR public.has_role(auth.uid(), ''admin''::app_role)))', v_table_name);
    END IF;
  END LOOP;
END
$$;

COMMENT ON TABLE private.approved_users IS
  'Immutable Supabase auth user UUIDs allowed to access application data.';
