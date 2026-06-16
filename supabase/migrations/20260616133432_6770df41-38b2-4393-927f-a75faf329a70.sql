ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS granting_license_approval text,
  ADD COLUMN IF NOT EXISTS license_approval_date date,
  ADD COLUMN IF NOT EXISTS cargo_details text,
  ADD COLUMN IF NOT EXISTS type_industry_production text;