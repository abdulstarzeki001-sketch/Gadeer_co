
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  license_number TEXT NOT NULL DEFAULT '',
  specialization TEXT NOT NULL DEFAULT '',
  governorate TEXT NOT NULL DEFAULT '',
  address TEXT,
  phone TEXT,
  email TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update companies" ON public.companies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Doc number sequence
CREATE SEQUENCE public.document_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  n  BIGINT := nextval('public.document_number_seq');
BEGIN
  RETURN yr || '-' || lpad(n::text, 6, '0');
END;
$$;

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number TEXT NOT NULL UNIQUE DEFAULT public.generate_document_number(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  company_name TEXT NOT NULL,
  company_name_project TEXT,
  subject TEXT,
  driver_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  licence_number TEXT,
  checkpoint_name_control TEXT NOT NULL,
  registration_governorate TEXT,
  cargo_typedetails TEXT,
  weight_quantity TEXT NOT NULL,
  destination_governorate TEXT,
  governorate_name TEXT,
  x_coordinate TEXT,
  y_coordinate TEXT,
  granting_license_approval TEXT,
  license_approval_number TEXT,
  license_approval_date TEXT,
  license_text_specialization TEXT,
  brand TEXT,
  notes TEXT,
  qr_code_data TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  document_value NUMERIC NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT ON public.documents TO anon;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone verify documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "auth insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete documents" ON public.documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_documents_company ON public.documents(company_id);
CREATE INDEX idx_documents_created ON public.documents(created_at DESC);

-- Document items
CREATE TABLE public.document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'طن',
  production_capacity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_items TO authenticated;
GRANT SELECT ON public.document_items TO anon;
GRANT ALL ON public.document_items TO service_role;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view items" ON public.document_items FOR SELECT USING (true);
CREATE POLICY "auth insert items" ON public.document_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update items" ON public.document_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete items" ON public.document_items FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_items_document ON public.document_items(document_id);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  document_number TEXT,
  driver_name TEXT,
  type TEXT NOT NULL DEFAULT 'charge',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tx" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert tx" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update tx" ON public.transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete tx" ON public.transactions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_tx_company ON public.transactions(company_id);
