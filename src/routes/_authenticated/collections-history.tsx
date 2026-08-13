import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, RefreshCcw, Search, UserRound, WalletCards } from "lucide-react";
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

  useEffect(() => { void loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const [{ data: traderData, error: traderError }, { data: collectionData, error: collectionError }] = await Promise.all([
      supabase.from("traders").select("id,name,phone").order("name"),
      supabase
        .from("transactions")
        .select("id,trader_id,amount,description,document_number,created_at,type")
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
      .history-table-wrap{overflow:auto;margin-top:16px}.history-table{width:100%;min-width:760px;border-collapse:collapse;background:transparent!important}.history-table th{padding:12px 14px;text-align:right;color:var(--accent)!important;background:var(--surface2)!important;border-bottom:1px solid var(--line)!important}.history-table td{padding:13px 14px;color:var(--text)!important;border-bottom:1px solid var(--line)!important}.history-client{display:flex;align-items:center;gap:9px}.history-client-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--surface2)!important;color:var(--accent)}.history-amount{font-weight:900;color:#16a34a!important;direction:ltr}.history-empty{padding:42px;text-align:center;color:var(--muted)!important}.history-error{margin-top:14px;padding:12px 14px;border-radius:13px;color:#dc2626!important;border:1px solid rgba(220,38,38,.22);background:rgba(220,38,38,.08)}
      @media(max-width:850px){.history-filters{grid-template-columns:1fr 1fr}.history-search{grid-column:1/-1}.history-refresh{grid-column:1/-1}.history-head{align-items:flex-start}}@media(max-width:500px){.history-stats{grid-template-columns:1fr}.history-filters{grid-template-columns:1fr}.history-search,.history-refresh{grid-column:auto}.history-head{flex-direction:column}.history-head a{width:100%;justify-content:center}}
    `}</style>
    <div className="history-page">
      <section className="history-head"><div><h1>سجل قبوض العملاء</h1><p>كل دفعة تم قبضها من عميل تظهر هنا مع التاريخ والمبلغ والملاحظة.</p></div><Link to="/collections"><ArrowRight size={17}/> قبض جديد</Link></section>
      {error ? <div className="history-error">{error}</div> : null}
      <section className="history-stats"><div className="history-stat gold"><span>إجمالي القبوض المعروضة</span><strong>{formatAmount(total)}</strong></div><div className="history-stat"><span>عدد عمليات القبض</span><strong>{filtered.length.toLocaleString("ar-IQ")}</strong></div></section>
      <section className="history-panel">
        <div className="history-filters">
          <div className="history-field history-search"><label>بحث</label><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="اسم العميل أو الملاحظة"/></div>
          <div className="history-field"><label>العميل</label><select value={clientId} onChange={(e)=>setClientId(e.target.value)}><option value="">كل العملاء</option>{traders.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="history-field"><label>من تاريخ</label><input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)}/></div>
          <div className="history-field"><label>إلى تاريخ</label><input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)}/></div>
          <button type="button" className="history-refresh" onClick={()=>void loadData()}><RefreshCcw size={16}/> تحديث</button>
        </div>
        {loading ? <div className="history-empty">جارٍ تحميل سجل القبوض...</div> : filtered.length === 0 ? <div className="history-empty">لا توجد عمليات قبض مطابقة.</div> : <div className="history-table-wrap"><table className="history-table"><thead><tr><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الملاحظة</th><th>رقم الوثيقة</th></tr></thead><tbody>{filtered.map((collection)=>{const trader=collection.trader_id?traderMap.get(collection.trader_id):null;return <tr key={collection.id}><td><div className="history-client"><span className="history-client-icon"><UserRound size={17}/></span><span>{trader?.name||"عميل غير معروف"}</span></div></td><td><CalendarDays size={14} style={{display:"inline",marginInlineEnd:5}}/>{formatDateTime(collection.created_at)}</td><td className="history-amount">{formatAmount(collection.amount)}</td><td>{collection.description||"—"}</td><td>{collection.document_number||"—"}</td></tr>})}</tbody></table></div>}
        <div style={{marginTop:14}}><Link to="/reports" style={{display:"inline-flex",alignItems:"center",gap:7,textDecoration:"none",color:"var(--text)"}}><WalletCards size={17}/> فتح تقارير حسابات العملاء</Link></div>
      </section>
    </div>
  </>;
}

function formatAmount(value:number){return new Intl.NumberFormat("ar-IQ",{maximumFractionDigits:2}).format(value||0)}
function formatDateTime(value:string){return new Intl.DateTimeFormat("ar-IQ",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
