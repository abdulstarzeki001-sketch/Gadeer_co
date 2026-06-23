ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cargo_typedetails TEXT;
CREATE INDEX IF NOT EXISTS idx_tx_driver ON public.transactions(driver_name);
CREATE INDEX IF NOT EXISTS idx_tx_cargo ON public.transactions(cargo_typedetails);