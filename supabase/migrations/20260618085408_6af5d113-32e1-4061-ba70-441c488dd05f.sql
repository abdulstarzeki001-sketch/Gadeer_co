
CREATE TABLE public.traders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.traders TO authenticated;
GRANT ALL ON public.traders TO service_role;
ALTER TABLE public.traders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read traders" ON public.traders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert traders" ON public.traders FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "owner or admin update traders" ON public.traders FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin delete traders" ON public.traders FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_traders_updated BEFORE UPDATE ON public.traders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.documents ADD COLUMN trader_id uuid REFERENCES public.traders(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN trader_id uuid REFERENCES public.traders(id) ON DELETE SET NULL;
CREATE INDEX idx_documents_trader ON public.documents(trader_id);
CREATE INDEX idx_tx_trader ON public.transactions(trader_id);
