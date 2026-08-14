-- Keep the transactions schema aligned with the application query and generated Supabase types.
alter table public.transactions
  add column if not exists cargo_typedetails text;
