import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  customerTransactions,
  readTrashMetadata,
  restoreCustomer,
  TRASH_PATTERN,
} from "@/lib/customer-trash";

type DeletedCustomer = { id: string; name: string; phone: string | null; notes: string | null };
type Movement = {
  id: string;
  amount: number;
  type: string;
  created_at: string;
  document_number: string | null;
};
const PAGE_SIZE = 20;
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "تعذر إتمام العملية. أعد المحاولة.";

export function CustomerTrash({ onRestored }: { onRestored: () => void }) {
  const [items, setItems] = useState<DeletedCustomer[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<DeletedCustomer | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const query = supabase
          .from("traders")
          .select("id,name,phone,notes", { count: "exact" })
          .like("notes", TRASH_PATTERN)
          .order("updated_at", { ascending: false })
          .order("id")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          .abortSignal(controller.signal);
        // Escape LIKE wildcards so search text is treated literally.
        if (search.trim()) query.ilike("name", `%${search.trim().replace(/[\\%_]/g, "\\$&")}%`);
        const result = await query;
        if (controller.signal.aborted) return;
        if (result.error) throw result.error;
        setItems(result.data ?? []);
        setCount(result.count ?? 0);
        if (!result.data?.length && page > 0) setPage(page - 1);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setItems([]);
          setError(errorText(caught));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, revision]);

  async function restore(item: DeletedCustomer) {
    setBusy(item.id);
    setError("");
    try {
      await restoreCustomer(supabase, item.id);
      setSelected(null);
      setRevision((value) => value + 1);
      onRestored();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel customer-trash" aria-label="سلة محذوفات العملاء">
      <style>{`.customer-trash .trash-toolbar,.customer-trash .trash-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}.customer-trash input{padding:10px;border:1px solid var(--border);border-radius:10px;flex:1;min-width:160px}.customer-trash button:disabled{opacity:.5;cursor:wait}.customer-trash .item-top{flex-wrap:wrap}.customer-trash .trash-table{overflow:auto;margin:16px 0}.customer-trash table{width:100%;min-width:550px;border-collapse:collapse}.customer-trash td,.customer-trash th{padding:10px;text-align:right;border-bottom:1px solid var(--border)}.customer-trash .trash-description{color:var(--muted-foreground);line-height:1.8}.customer-trash .trash-details{border:1px solid var(--border);border-radius:14px;padding:16px;margin-top:16px}`}</style>
      <h2>
        <Trash2 size={20} /> سلة المحذوفات
      </h2>
      <p className="trash-description">
        العملاء هنا مخفيون مع حركاتهم ووصولاتهم من كشف الحساب والتقارير. الاسترجاع يعيدها جميعًا مع
        بياناتها الأصلية.
      </p>
      <div className="trash-toolbar">
        <input
          aria-label="بحث في العملاء المحذوفين"
          placeholder="ابحث باسم العميل"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
            setSelected(null);
          }}
        />
        <button
          className="btn secondary"
          type="button"
          disabled={loading || busy !== null}
          onClick={() => setRevision((value) => value + 1)}
        >
          تحديث
        </button>
      </div>
      {error && (
        <p role="alert" className="msg error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">جارٍ تحميل سلة المحذوفات...</p>
      ) : (
        <div className="list">
          {items.length === 0 ? (
            <p>لا يوجد عملاء محذوفون مطابقون.</p>
          ) : (
            items.map((item) => {
              const metadata = readTrashMetadata(item.notes);
              return (
                <article className="item" key={item.id}>
                  <div className="item-top">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.phone || "بدون هاتف"}</p>
                      <p>
                        تاريخ الحذف:{" "}
                        {metadata
                          ? new Date(metadata.deletedAt).toLocaleString("ar-IQ")
                          : "غير متاح"}
                      </p>
                    </div>
                    <div className="trash-actions">
                      <button
                        type="button"
                        className="btn secondary"
                        aria-expanded={selected?.id === item.id}
                        onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      >
                        عرض الحركات
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={busy !== null || !metadata}
                        onClick={() => void restore(item)}
                      >
                        <RotateCcw size={15} />{" "}
                        {busy === item.id ? "جارٍ الاسترجاع..." : "استرجاع العميل وحركاته"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
      <div className="trash-actions">
        <button
          type="button"
          className="btn secondary"
          disabled={loading || page === 0}
          onClick={() => {
            setPage(page - 1);
            setSelected(null);
          }}
        >
          السابق
        </button>
        <span>
          صفحة {page + 1} · {count} عميل
        </span>
        <button
          type="button"
          className="btn secondary"
          disabled={loading || (page + 1) * PAGE_SIZE >= count}
          onClick={() => {
            setPage(page + 1);
            setSelected(null);
          }}
        >
          التالي
        </button>
      </div>
      {selected && <TrashMovements key={selected.id} customer={selected} />}
    </section>
  );
}

function TrashMovements({ customer }: { customer: DeletedCustomer }) {
  const [rows, setRows] = useState<Movement[]>([]);
  const [count, setCount] = useState(0);
  const [documents, setDocuments] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const [movements, receipts] = await Promise.all([
          customerTransactions(supabase, customer.id)
            .order("created_at", { ascending: false })
            .order("id")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .abortSignal(controller.signal),
          supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("trader_id", customer.id)
            .abortSignal(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (movements.error) throw movements.error;
        if (receipts.error) throw receipts.error;
        setRows(movements.data ?? []);
        setCount(movements.count ?? 0);
        setDocuments(receipts.count ?? 0);
      } catch (caught) {
        if (!controller.signal.aborted) setError(errorText(caught));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [customer.id, page]);
  return (
    <div className="trash-details">
      <h3>حركات {customer.name}</h3>
      {error ? (
        <p role="alert" className="msg error">
          {error}
        </p>
      ) : loading ? (
        <p role="status">جارٍ تحميل الحركات...</p>
      ) : (
        <>
          <p>
            {count} حركة مالية · {documents} وصل مرتبط
          </p>
          {rows.length === 0 ? (
            <p>لا توجد حركات مالية لهذا العميل.</p>
          ) : (
            <div className="trash-table">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>نوع الحركة</th>
                    <th>رقم الوصل</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.created_at).toLocaleString("ar-IQ")}</td>
                      <td>{row.type}</td>
                      <td>{row.document_number || "—"}</td>
                      <td>
                        {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
                          row.amount,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="trash-actions">
            <button
              type="button"
              className="btn secondary"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              السابق
            </button>
            <span>صفحة {page + 1}</span>
            <button
              type="button"
              className="btn secondary"
              disabled={(page + 1) * PAGE_SIZE >= count}
              onClick={() => setPage(page + 1)}
            >
              التالي
            </button>
          </div>
        </>
      )}
    </div>
  );
}
