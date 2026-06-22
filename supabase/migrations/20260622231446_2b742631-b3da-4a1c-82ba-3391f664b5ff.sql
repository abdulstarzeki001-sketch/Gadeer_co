DROP POLICY IF EXISTS "admin insert companies" ON public.companies;
DROP POLICY IF EXISTS "admin update companies" ON public.companies;
DROP POLICY IF EXISTS "admin delete companies" ON public.companies;

CREATE POLICY "auth insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update companies" ON public.companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete companies" ON public.companies FOR DELETE TO authenticated USING (true);