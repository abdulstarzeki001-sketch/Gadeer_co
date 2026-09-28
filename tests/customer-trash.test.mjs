import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  archiveCustomer,
  restoreCustomer,
  readTrashMetadata,
  TRASH_PREFIX,
  TRASH_PATTERN,
  activeCustomers,
  activeTransactions,
  activeDocuments,
  customerTransactions,
} from "../src/lib/customer-trash.ts";

const id = "10000000-0000-4000-8000-000000000001";
function fixture(notes) {
  const state = { notes, requests: [], conflict: false, denied: false };
  const client = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init = {}) => {
        const url = new URL(String(input));
        state.requests.push({ url, method: init.method, body: init.body });
        let body = { notes: state.notes };
        let status = 200;
        if (init.method === "PATCH") {
          const expected = state.notes === null ? "is.null" : `eq.${state.notes}`;
          assert.equal(
            url.searchParams.get("notes"),
            expected,
            "write must compare original notes",
          );
          assert.equal(
            url.pathname,
            "/rest/v1/traders",
            "never delete or rewrite financial records",
          );
          if (state.denied) {
            body = { code: "42501", message: "permission denied" };
            status = 403;
          } else if (state.conflict) body = null;
          else {
            state.notes = JSON.parse(init.body).notes;
            body = { id };
          }
        }
        return new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  return { state, client };
}

for (const notes of [
  null,
  "",
  'ملاحظات العميل\nرصيد 123.45 — "خاص" % _',
  TRASH_PREFIX + "text as original notes",
]) {
  if (notes?.startsWith(TRASH_PREFIX)) continue;
  test(`archive/restore preserves original notes (${JSON.stringify(notes)})`, async () => {
    const { state, client } = fixture(notes);
    await archiveCustomer(client, id);
    assert.equal(readTrashMetadata(state.notes).originalNotes, notes);
    const archived = state.notes;
    await archiveCustomer(client, id);
    assert.equal(state.notes, archived, "archive is idempotent");
    await restoreCustomer(client, id);
    assert.equal(state.notes, notes);
    await restoreCustomer(client, id);
    assert.equal(state.requests.filter((request) => request.method === "PATCH").length, 2);
    assert.ok(
      state.requests.every((request) => request.method === "GET" || request.method === "PATCH"),
    );
  });
}

test("failed permissions do not lose notes or report successful archive", async () => {
  const { state, client } = fixture("important");
  state.denied = true;
  await assert.rejects(archiveCustomer(client, id));
  assert.equal(state.notes, "important");
});
test("concurrent edit requires reload instead of reporting success", async () => {
  const { state, client } = fixture("original");
  state.conflict = true;
  await assert.rejects(archiveCustomer(client, id), /تغيّرت/);
  assert.equal(state.notes, "original");
});
test("corrupted trash data cannot overwrite the original record", async () => {
  const { state, client } = fixture(TRASH_PREFIX + "{invalid");
  await assert.rejects(restoreCustomer(client, id), /الاسترجاع/);
  assert.equal(state.requests.filter((request) => request.method === "PATCH").length, 0);
});
test("active records exclude trash before pagination including document-linked movements", () => {
  const { client } = fixture(null);
  const customerUrl = activeCustomers(client).url;
  assert.equal(
    customerUrl.searchParams.get("or"),
    `(notes.is.null,notes.not.like.${TRASH_PATTERN})`,
  );
  const tx = activeTransactions(client).limit(500).url;
  assert.equal(tx.searchParams.get("archived_customer"), "is.null");
  assert.equal(tx.searchParams.get("archived_customer.notes"), `like.${TRASH_PATTERN}`);
  assert.equal(tx.searchParams.get("archived_document"), "is.null");
  assert.equal(
    tx.searchParams.get("archived_document.archived_owner.notes"),
    `like.${TRASH_PATTERN}`,
  );
  assert.match(tx.searchParams.get("select"), /documents_trader_id_fkey!inner/);
  const doc = activeDocuments(client).url;
  assert.equal(doc.searchParams.get("archived_customer"), "is.null");
  const history = customerTransactions(client, id).url;
  assert.equal(
    history.searchParams.get("or"),
    `(trader_id.eq.${id},customer_document.not.is.null)`,
  );
});
