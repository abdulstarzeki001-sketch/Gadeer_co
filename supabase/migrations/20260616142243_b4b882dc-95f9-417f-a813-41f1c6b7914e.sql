ALTER TABLE public.documents
  ALTER COLUMN driver_name DROP NOT NULL,
  ALTER COLUMN vehicle_number DROP NOT NULL,
  ALTER COLUMN checkpoint_name_control DROP NOT NULL,
  ALTER COLUMN weight_quantity DROP NOT NULL;