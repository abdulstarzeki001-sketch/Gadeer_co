create index if not exists idx_documents_created_by on public.documents(created_by);
create index if not exists idx_traders_created_by on public.traders(created_by);
create index if not exists idx_transactions_created_by on public.transactions(created_by);
create index if not exists idx_transactions_document_id on public.transactions(document_id);
