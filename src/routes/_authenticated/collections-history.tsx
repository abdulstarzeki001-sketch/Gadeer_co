import { collectionDescription } from "@/lib/customer-statement";
import { activeCustomers, activeTransactions } from "@/lib/customer-trash";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Pencil, RefreshCcw, Search, Trash2, UserRound, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/collections-history")({
  head: () => ({ meta: [{ title: "سجل القبوض | الغدير" }, { name: "description", content: "سجل جميع المبالغ المقبوضة من العملاء." }] }),
  component: CollectionsHistoryPage,
});

type Trader = { id: string; name: string; phone: string | null };
type Collection = {
  id: string;
  trader_id: string | null;
  amount: number;
  description: string | null;
  document_number: string | null;
  created_at: string;
  type: string;
};

function CollectionsHistoryPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editSender, setEditSender] = useState("");
  const [editMethod, setEditMethod] = useState("نقداً");
  const [editNote, setEditNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  useEffect(() => { void loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const [{ data: traderData, error: traderError }, { data: collectionData, error: collectionError }] = await Promise.all([
      activeCustomers(supabase).order("name"),
      activeTransactions(supabase)
        .eq("type", "تحصيل من عميل")
        .order("created_at", { ascending: false }),
    ]);

    if (traderError || collectionError) {
      setError(traderError?.message || collectionError?.message || "تعذر تحميل سجل القبوض.");
    } else {
      setTraders((traderData ?? []) as Trader[]);
      setCollections((collectionData ?? []) as Collection[]);
    }
    setLoading(false);
  }

  function beginEdit(collection: Collection) {
    let details: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(collection.description ?? "");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) details = parsed as Record<string, unknown>;
    } catch { /* Keep legacy plain-text receipts editable. */ }
    setEditing(collection);
    setEditAmount(String(collection.amount));
    setEditSender(typeof details.senderName === "string" ? details.senderName : "");
    setEditMethod(typeof details.paymentMethod === "string" ? details.paymentMethod : "نقداً");
    setEditNote(typeof details.note === "string" ? details.note : collectionDescription(collection.description));
    setNotice(null);
    setError(null);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busyId) return;
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) {
      setError("أدخل مبلغ قبض صحيحاً."); return;
    }
    if (!editSender.trim()) { setError("أدخل اسم المرسل."); return; }
    setBusyId(editing.id);
    setError(null);
    // Restrict the mutation to collection receipts: never modify an invoice by mistake.
    const { data, error: updateError } = await supabase.from("transactions")
      .update({ amount, description: JSON.stringify({
        collection_receipt: true, senderName: editSender.trim(),
        paymentMethod: editMethod, note: editNote.trim(),
      }) })
      .eq("id", editing.id).eq("type", "تحصيل من عميل").select("id");
    setBusyId(null);
    if (updateError) { setError(updateError.message); return; }
    if (!data?.length) { setError("لم يتم تعديل القبض. تحقق من صلاحياتك أو حدّث الصفحة."); return; }
    setEditing(null);
    await loadData();
    setNotice("تم تعديل القبض وتحديث الرصيد المعروض.");
  }

  async function deleteCollection(collection: Collection) {
    if (busyId || !window.confirm(`حذف قبض بقيمة ${formatAmount(collection.amount)} من حساب العميل؟ سيُعاد احتساب رصيده بعد الحذف. لا يمكن التراجع عن هذا الإجراء.`)) return;
    setBusyId(collection.id);
    setError(null);
    const { data, error: deleteError } = await supabase.from("transactions")
      .delete().eq("id", collection.id).eq("type", "تحصيل من عميل").select("id");
    setBusyId(null);
    if (deleteError) { setError(deleteError.message); return; }
    if (!data?.length) { setError("لم يتم حذف القبض. تحقق من صلاحياتك أو حدّث الصفحة."); return; }
    if (editing?.id === collection.id) setEditing(null);
    await loadData();
    setNotice("تم حذف القبض وتحديث السجل.");
  }

  const traderMap = useMemo(() => new Map(traders.map((trader) => [trader.id, trader])), [traders]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections.filter((collection) => {
      if (clientId && collection.trader_id !== clientId) return false;
      const date = new Date(collection.created_at);
      if (dateFrom && date < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && date > new Date(`${dateTo}T23:59:59`)) return false;
      if (!q) return true;
      const trader = collection.trader_id ? traderMap.get(collection.trader_id) : null;
      return [trader?.name ?? "", trader?.phone ?? "", collection.description ?? "", collection.document_number ?? ""]
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [clientId, collections, dateFrom, dateTo, search, traderMap]);

  const total = filtered.reduce((sum, collection) => sum + (Number(collection.amount) || 0), 0);

  return <>
    <style>{`
      .history-page{--surface:#fff;--surface2:#f8fafc;--text:#17233f;--muted:#667085;--line:#d9dfeb;--accent:#c9a14a;--shadow:0 16px 38px rgba(15,23,42,.1);width:min(100%,1100px);margin:0 auto;padding:24px 14px 110px;color:var(--text)!important}
      html[data-ghadeer-theme="dark"] .history-page{--surface:#071a3b;--surface2:#061c40;--text:#fff;--muted:rgba(255,255,255,.66);--line:rgba(35,143,247,.34);--accent:#f0c55f;--shadow:0 18px 42px rgba(0,0,0,.2)}
      .history-head,.history-panel,.history-stat{border:1px solid var(--line);background:var(--surface)!important;box-shadow:var(--shadow)}.history-head{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;border-radius:22px}.history-head h1{margin:0 0 6px;color:var(--text)!important}.history-head p{margin:0;color:var(--muted)!important}.history-head a{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface2)!important;color:var(--text)!important;text-decoration:none}
      .history-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.history-stat{padding:17px;border-radius:17px}.history-stat span{display:block;color:var(--muted)!important;font-size:.82rem}.history-stat strong{display:block;margin-top:8px;color:var(--text)!important;font-size:1.35rem}.history-stat.gold strong{color:var(--accent)!important}
      .history-panel{padding:18px;border-radius:20px}.history-filters{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr auto;gap:10px;align-items:end}.history-field label{display:block;margin-bottom:6px;color:var(--text)!important;font-size:.8rem;font-weight:800}.history-field input,.history-field select{width:100%;margin:0!important;padding:10px 12px!important;border:1px solid var(--line)!important;border-radius:12px!important;background:var(--surface2)!important;color:var(--text)!important}.history-search{position:relative}.history-search svg{position:absolute;right:12px;bottom:12px;color:var(--muted)}.history-search input{padding-right:38px!important}.history-refresh{min-height:43px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 12px;border:1px solid var(--line)!important;border-radius:12px!important;background:var(--surface2)!important;color:var(--text)!important;cursor:pointer}
      .history-notice{margin:12px 0;padding:12px;border:1px solid #16a34a;border-radius:12px;color:#16a34a}
      .history-editor{margin:16px 0}.history-editor h2{font-size:1.1rem;margin:0 0 14px;color:var(--text)}.history-edit-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.history-edit-form label{display:grid;gap:6px;font-weight:700;color:var(--text)}.history-edit-form input,.history-edit-form select{width:100%;padding:11px;border:1px solid var(--line);border-radius:11px;background:var(--surface2);color:var(--text)}.history-edit-buttons{display:flex;gap:8px;flex-wrap:wrap;grid-column:1/-1}.history-edit-buttons button{padding:9px 13px;border:1px solid var(--line);border-radius:10px;background:var(--surface2);color:var(--text);cursor:pointer}.history-edit-buttons button[type=submit]{background:#137a61;color:white}.history-edit-buttons button:disabled{opacity:.5;cursor:not-allowed}.history-row{cursor:pointer;transition:.18s ease}.history-row:hover{background:rgba(201,161,74,.05)}.history-row.selected{background:rgba(201,161,74,.09)}.history-action-cell{position:relative;min-width:170px}.history-action-trigger{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:108px;padding:9px 14px;border:1px solid rgba(201,161,74,.45);border-radius:999px;background:linear-gradient(135deg,rgba(201,161,74,.16),rgba(201,161,74,.05));color:var(--text);font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(15,23,42,.08)}.history-action-menu{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;animation:historyMenuIn .16s ease}.history-action-menu button{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:11px;border:1px solid var(--line);background:var(--surface);color:var(--text);font-weight:800;cursor:pointer}.history-action-menu button.edit{border-color:rgba(19,122,97,.35);color:#137a61}.history-action-menu button.danger{border-color:rgba(220,38,38,.35);color:#dc2626}.history-action-menu button:disabled{opacity:.5;cursor:not-allowed}@keyframes historyMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      .history-table-wrap{overflow:auto;margin-top:16px}.history-table{width:100%;min-width:760px;border-collapse:collapse;background:transparent!important}.history-table th{padding:12px 14px;text-align:right;color:var(--accent)!important;background:var(--surface2)!important;border-bottom:1px solid var(--line)!important}.history-table td{padding:13px 14px;color:var(--text)!important;border-bottom:1px solid var(--line)!important}.history-client{display:flex;align-items:center;gap:9px}.history-client-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--surface2)!important;color:var(--accent)}.history-amount{font-weight:900;color:#16a34a!important;direction:ltr}.history-empty{padding:42px;text-align:center;color:var(--muted)!important}.history-error{margin-top:14px;padding:12px 14px;border-radius:13px;color:#dc2626!important;border:1px solid rgba(220,38,38,.22);background:rgba(220,38,38,.08)}
      @media(max-width:850px){.history-edit-form{grid-template-columns:1fr}.history-filters{grid-template-columns:1fr 1fr}.history-search{grid-column:1/-1}.history-refresh{grid-column:1/-1}.history-head{align-items:flex-start}}@media(max-width:500px){.history-stats{grid-template-columns:1fr}.history-filters{grid-template-columns:1fr}.history-search,.history-refresh{grid-column:auto}.history-head{flex-direction:column}.history-head a{width:100%;justify-content:center}}
    `}</style>
    <div className="history-page">
      <section className="history-head"><div><h1>سجل قبوض العملاء</h1><p>كل دفعة تم قبضها من عميل تظهر هنا مع التاريخ والمبلغ والملاحظة.</p></div><Link to="/collections"><ArrowRight size={17}/> قبض جديد</Link></section>
      {error ? <div className="history-error" role="alert">{error}</div> : null}
      {notice ? <div className="history-notice" role="status">{notice}</div> : null}
      {editing ? <section className="history-panel history-editor" aria-label="تعديل القبض">
        <h2>تعديل القبض</h2>
        <form onSubmit={saveEdit} className="history-edit-form">
          <label>المبلغ (د.ع)<input type="number" min="0.01" step="0.01" required value={editAmount} onChange={e=>setEditAmount(e.target.value)}/></label>
          <label>اسم المرسل<input required value={editSender} onChange={e=>setEditSender(e.target.value)}/></label>
          <label>طريقة الدفع<select value={editMethod} onChange={e=>setEditMethod(e.target.value)}><option>نقداً</option><option>تحويل بنكي</option><option>حوالة</option><option>أخرى</option></select></label>
          <label>ملاحظات<input value={editNote} onChange={e=>setEditNote(e.target.value)}/></label>
          <div className="history-edit-buttons"><button type="submit" disabled={busyId !== null}>حفظ التعديل</button><button type="button" disabled={busyId !== null} onClick={()=>setEditing(null)}>إلغاء</button></div>
        </form>
      </section> : null}
      <section className="history-stats"><div className="history-stat gold"><span>إجمالي القبوض المعروضة</span><strong>{formatAmount(total)}</strong></div><div className="history-stat"><span>عدد عمليات القبض</span><strong>{filtered.length.toLocaleString("ar-IQ")}</strong></div></section>
      <section className="history-panel">
        <div className="history-filters">
          <div className="history-field history-search"><label>بحث</label><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="اسم العميل أو الملاحظة"/></div>
          <div className="history-field"><label>العميل</label><select value={clientId} onChange={(e)=>setClientId(e.target.value)}><option value="">كل العملاء</option>{traders.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="history-field"><label>من تاريخ</label><input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)}/></div>
          <div className="history-field"><label>إلى تاريخ</label><input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)}/></div>
          <button type="button" className="history-refresh" onClick={()=>void loadData()}><RefreshCcw size={16}/> تحديث</button>
        </div>
        {loading ? <div className="history-empty">جارٍ تحميل سجل القبوض...</div> : filtered.length === 0 ? <div className="history-empty">لا توجد عمليات قبض مطابقة.</div> : <div className="history-table-wrap"><table className="history-table"><thead><tr><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الملاحظة</th><th>رقم الوثيقة</th><th>الإجراءات</th></tr></thead><tbody>{filtered.map((collection)=>{const trader=collection.trader_id?traderMap.get(collection.trader_id):null;const actionsOpen=openActionsId===collection.id;return <tr key={collection.id} className={`history-row${actionsOpen?" selected":""}`} onClick={()=>setOpenActionsId(actionsOpen?null:collection.id)}><td><div className="history-client"><span className="history-client-icon"><UserRound size={17}/></span><span>{trader?.name||"عميل غير معروف"}</span></div></td><td><CalendarDays size={14} style={{display:"inline",marginInlineEnd:5}}/>{formatDateTime(collection.created_at)}</td><td className="history-amount">{formatAmount(collection.amount)}</td><td>{collectionDescription(collection.description)}</td><td>{collection.document_number||"—"}</td><td className="history-action-cell" onClick={(e)=>e.stopPropagation()}><button type="button" className="history-action-trigger" onClick={()=>setOpenActionsId(actionsOpen?null:collection.id)}>إجراءات</button>{actionsOpen?<div className="history-action-menu"><button type="button" className="edit" disabled={busyId!==null} onClick={()=>{setOpenActionsId(null);beginEdit(collection)}}><Pencil size={15}/> تعديل</button><button type="button" className="danger" disabled={busyId!==null} onClick={()=>{setOpenActionsId(null);void deleteCollection(collection)}}><Trash2 size={15}/> حذف</button></div>:null}</td></tr>})}</tbody></table></div>}
        <div style={{marginTop:14}}><Link to="/reports" style={{display:"inline-flex",alignItems:"center",gap:7,textDecoration:"none",color:"var(--text)"}}><WalletCards size={17}/> فتح تقارير حسابات العملاء</Link></div>
      </section>
    </div>
  </>;
}

function formatAmount(value:number){return new Intl.NumberFormat("ar-IQ",{maximumFractionDigits:2}).format(value||0)}
function formatDateTime(value:string){return new Intl.DateTimeFormat("ar-IQ",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
