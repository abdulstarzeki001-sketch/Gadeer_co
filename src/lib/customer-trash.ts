import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../integrations/supabase/types";

type Client = SupabaseClient<Database>;
// Persist the tombstone in an existing nullable text column so this release
// works without a separate database migration. Original notes are lossless.
export const TRASH_PREFIX = "GHADEER-CUSTOMER-TRASH-V1:";
export const TRASH_PATTERN = `${TRASH_PREFIX}%`;
export const ACTIVE_CUSTOMER_FILTER = `notes.is.null,notes.not.like.${TRASH_PATTERN}`;
export type TrashMetadata = { deletedAt: string; originalNotes: string | null };

export function readTrashMetadata(notes: string | null): TrashMetadata | null {
  if (!notes?.startsWith(TRASH_PREFIX)) return null;
  try {
    const value = JSON.parse(notes.slice(TRASH_PREFIX.length));
    if (
      value &&
      typeof value.deletedAt === "string" &&
      Number.isFinite(Date.parse(value.deletedAt)) &&
      (value.originalNotes === null || typeof value.originalNotes === "string")
    )
      return value;
  } catch {
    /* An invalid tombstone must never overwrite the original notes. */
  }
  return null;
}

export function activeCustomers(client: Client) {
  return client.from("traders").select("*").or(ACTIVE_CUSTOMER_FILTER);
}

export function activeTransactions(client: Client) {
  // Filter before limits/aggregation. Include unassigned transactions; exclude
  // archived owners reached either directly or through their document.
  return client
    .from("transactions")
    .select(
      "*,archived_customer:traders!transactions_trader_id_fkey(),archived_document:documents!transactions_document_id_fkey(archived_owner:traders!documents_trader_id_fkey!inner())",
    )
    .like("archived_customer.notes", TRASH_PATTERN)
    .is("archived_customer", null)
    .like("archived_document.archived_owner.notes", TRASH_PATTERN)
    .is("archived_document", null);
}

export function activeDocuments(client: Client) {
  return client
    .from("documents")
    .select("*,archived_customer:traders!documents_trader_id_fkey()")
    .like("archived_customer.notes", TRASH_PATTERN)
    .is("archived_customer", null);
}

export function customerTransactions(client: Client, customerId: string) {
  return client
    .from("transactions")
    .select("*,customer_document:documents!transactions_document_id_fkey()", { count: "exact" })
    .eq("customer_document.trader_id", customerId)
    .or(`trader_id.eq.${customerId},customer_document.not.is.null`);
}

export async function requireActiveCustomer(client: Client, customerId: string) {
  const { data, error } = await activeCustomers(client).eq("id", customerId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("العميل موجود في سلة المحذوفات أو لم يعد متاحًا. حدّث القائمة.");
}

async function replaceNotes(
  client: Client,
  id: string,
  previous: string | null,
  next: string | null,
) {
  const query = client.from("traders").update({ notes: next }).eq("id", id);
  const result = await (previous === null ? query.is("notes", null) : query.eq("notes", previous))
    .select("id")
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data)
    throw new Error("تغيّرت بيانات العميل أو لا تملك صلاحية التعديل. حدّث القائمة وحاول مجددًا.");
}

export async function archiveCustomer(client: Client, id: string) {
  const { data, error } = await client.from("traders").select("notes").eq("id", id).single();
  if (error) throw error;
  if (data.notes?.startsWith(TRASH_PREFIX)) return;
  await replaceNotes(
    client,
    id,
    data.notes,
    TRASH_PREFIX +
      JSON.stringify({
        deletedAt: new Date().toISOString(),
        originalNotes: data.notes,
      } satisfies TrashMetadata),
  );
}

export async function restoreCustomer(client: Client, id: string) {
  const { data, error } = await client.from("traders").select("notes").eq("id", id).single();
  if (error) throw error;
  if (!data.notes?.startsWith(TRASH_PREFIX)) return;
  const metadata = readTrashMetadata(data.notes);
  if (!metadata) throw new Error("تعذر قراءة بيانات الاسترجاع. لم يتم تغيير أي بيانات.");
  await replaceNotes(client, id, data.notes, metadata.originalNotes);
}
