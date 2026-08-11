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

    EXECUTE format(
      'CREATE POLICY approved_user_access ON public.%I FOR ALL TO authenticated USING (public.is_approved_user()) WITH CHECK (public.is_approved_user())',
      v_table_name
    );
  END LOOP;
END
$$;

COMMENT ON TABLE private.approved_users IS
  'Immutable Supabase auth user UUIDs allowed to access application data.';
