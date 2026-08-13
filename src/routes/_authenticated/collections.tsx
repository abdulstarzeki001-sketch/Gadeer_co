import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, History, Search, UserRound, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/collections")({
  head: () => ({ meta: [{ title: "قبض من عميل | الغدير" }, { name: "description", content: "تسجيل قبض مبلغ من العميل وتنزيله من رصيده." }] }),
  component: CollectionsPage,
});

type Trader = { id: string; name: string; phone: string | null; address: string | null };
type Tx = { id: string; trader_id: string | null; company_id: string; amount: number; type: string; created_at: string };

function CollectionsPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { void loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setMessage(null);
    const [{ data: tradersData, error: tradersError }, { data: txData, error: txError }] = await Promise.all([
      supabase.from("traders").select("id,name,phone,address").order("name"),
      supabase.from("transactions").select("id,trader_id,company_id,amount,type,created_at").order("created_at", { ascending: false }),
    ]);
    if (tradersError || txError) {
      setMessage({ ok: false, text: tradersError?.message || txError?.message || "تعذر تحميل بيانات العملاء." });
    } else {
      const next = (tradersData ?? []) as Trader[];
      setTraders(next);
      setTransactions((txData ?? []) as Tx[]);
      setSelectedId((current) => current || next[0]?.id || "");
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? traders.filter((t) => [t.name, t.phone ?? "", t.address ?? ""].some((v) => v.toLowerCase().includes(q))) : traders;
  }, [search, traders]);

  const selected = traders.find((t) => t.id === selectedId) ?? null;
  const selectedTransactions = transactions.filter((t) => t.trader_id === selectedId);
  const balance = selectedTransactions.reduce((sum, t) => sum + (isDebtIncrease(t.type) ? Number(t.amount) || 0 : -(Number(t.amount) || 0)), 0);
  const numericAmount = Number(amount) || 0;
  const afterBalance = balance - numericAmount;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!selected) return setMessage({ ok: false, text: "اختر العميل أولاً." });
    if (numericAmount <= 0) return setMessage({ ok: false, text: "أدخل مبلغ قبض صحيح." });

    const companyId = selectedTransactions.find((t) => t.company_id)?.company_id;
    if (!companyId) {
      return setMessage({ ok: false, text: "لا يمكن تسجيل قبض لهذا العميل قبل وجود حركة حساب سابقة مرتبطة به." });
    }

    setSaving(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setMessage({ ok: false, text: "تعذر التحقق من المستخدم الحالي." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      trader_id: selected.id,
      company_id: companyId,
      amount: numericAmount,
      type: "تحصيل من عميل",
      description: note.trim() || `قبض نقدي من العميل ${selected.name}`,
      created_by: userData.user.id,
    });

    if (error) {
      setMessage({ ok: false, text: error.message });
    } else {
      setAmount("");
      setNote("");
      await loadData();
      setMessage({ ok: true, text: `تم تسجيل القبض بنجاح وتنزيل ${formatAmount(numericAmount)} من حساب ${selected.name}.` });
    }
    setSaving(false);
  }

  return <>
    <style>{`
      .collection-page{--surface:#fff;--surface2:#f8fafc;--text:#17233f;--muted:#667085;--line:#d9dfeb;--accent:#c9a14a;--shadow:0 16px 38px rgba(15,23,42,.1);width:min(100%,1000px);margin:0 auto;padding:24px 14px 110px;color:var(--text)!important}
      html[data-ghadeer-theme="dark"] .collection-page{--surface:#071a3b;--surface2:#061c40;--text:#fff;--muted:rgba(255,255,255,.66);--line:rgba(35,143,247,.34);--accent:#f0c55f;--shadow:0 18px 42px rgba(0,0,0,.2)}
      .collection-head,.collection-panel,.balance-card{border:1px solid var(--line);background:var(--surface)!important;box-shadow:var(--shadow)}.collection-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:22px;border-radius:22px}.collection-head h1{margin:0 0 6px;color:var(--text)!important}.collection-head p{margin:0;color:var(--muted)!important}.collection-head-icon{width:64px;height:64px;display:grid;place-items:center;border-radius:20px;background:var(--surface2)!important;color:var(--accent)}
      .collection-grid{display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px;margin-top:16px}.collection-panel{padding:18px;border-radius:20px}.collection-panel h2{margin:0 0 12px;color:var(--text)!important;font-size:1.05rem}.collection-search{position:relative;margin-bottom:10px}.collection-search svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--muted)}.collection-search input,.collection-form input,.collection-form textarea{width:100%;background:var(--surface2)!important;color:var(--text)!important;border:1px solid var(--line)!important;border-radius:13px!important}.collection-search input{padding:10px 40px 10px 12px!important}.client-list{display:grid;gap:8px;max-height:470px;overflow:auto}.client-pick{width:100%;display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;text-align:right;padding:10px;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:var(--text)!important}.client-pick.active{border-color:var(--accent)!important;background:var(--surface2)!important}.client-pick-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:var(--surface2)!important;color:var(--accent)}.client-pick strong,.client-pick small{display:block;color:var(--text)!important}.client-pick small{opacity:.58;margin-top:2px}
      .balance-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}.balance-card{padding:15px;border-radius:16px}.balance-card span{display:block;color:var(--muted)!important;font-size:.8rem}.balance-card strong{display:block;margin-top:8px;color:var(--text)!important;font-size:1.2rem;direction:ltr;text-align:right}.balance-card.after strong{color:#16a34a!important}.collection-form{display:grid;gap:12px}.collection-form label{display:grid;gap:6px;color:var(--text)!important;font-weight:800}.collection-form input,.collection-form textarea{padding:12px!important}.collection-form textarea{min-height:90px;resize:vertical}.collection-submit{min-height:56px;border:1px solid #ffe08a!important;border-radius:15px!important;background:linear-gradient(100deg,#d9a936,#ffe082 48%,#f4c455)!important;color:#07142f!important;font-weight:900;font-size:1rem;cursor:pointer}.collection-submit:disabled{opacity:.55;cursor:not-allowed}.collection-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.collection-links a{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface2)!important;color:var(--text)!important;text-decoration:none}.collection-message{margin-top:14px;padding:12px 14px;border-radius:13px}.collection-message.ok{background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.25);color:#16a34a!important}.collection-message.bad{background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.22);color:#dc2626!important}
      @media(max-width:780px){.collection-grid{grid-template-columns:1fr}.client-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:280px}.balance-grid{grid-template-columns:1fr 1fr}.balance-card.after{grid-column:1/-1}}@media(max-width:480px){.collection-head{align-items:flex-start}.collection-head-icon{width:54px;height:54px}.client-list{grid-template-columns:1fr}.balance-grid{grid-template-columns:1fr}.balance-card.after{grid-column:auto}}
    `}</style>
    <div className="collection-page">
      <section className="collection-head"><div><h1>قبض مبلغ من عميل</h1><p>سجّل المبلغ المقبوض وسيتم احتسابه مباشرة كتنزيل من رصيد العميل.</p></div><div className="collection-head-icon"><Banknote size={32}/></div></section>
      <div className="collection-grid">
        <aside className="collection-panel"><h2>اختيار العميل</h2><div className="collection-search"><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="ابحث عن العميل"/></div><div className="client-list">{loading?<div>جارٍ التحميل...</div>:filtered.map((t)=><button key={t.id} type="button" className={`client-pick${selectedId===t.id?" active":""}`} onClick={()=>setSelectedId(t.id)}><span className="client-pick-icon"><UserRound size={19}/></span><span><strong>{t.name}</strong><small>{t.phone||t.address||"بدون تفاصيل"}</small></span></button>)}</div></aside>
        <main className="collection-panel"><h2>{selected ? `حساب ${selected.name}` : "اختر عميلًا"}</h2><div className="balance-grid"><div className="balance-card"><span>الرصيد الحالي</span><strong>{formatAmount(balance)}</strong></div><div className="balance-card"><span>مبلغ القبض</span><strong>{formatAmount(numericAmount)}</strong></div><div className="balance-card after"><span>الرصيد بعد القبض</span><strong>{formatAmount(afterBalance)}</strong></div></div><form className="collection-form" onSubmit={handleSubmit}><label>المبلغ المقبوض<input type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0" required/></label><label>ملاحظة<textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="مثال: دفعة نقدية عن حساب العميل"/></label><button className="collection-submit" type="submit" disabled={saving||!selected}>{saving?"جارٍ الحفظ...":"تسجيل القبض وتنزيله من الحساب"}</button></form>{message?<div className={`collection-message ${message.ok?"ok":"bad"}`}>{message.ok?<CheckCircle2 size={17} style={{display:"inline",marginInlineEnd:6}}/>:null}{message.text}</div>:null}<div className="collection-links"><Link to="/collections-history"><History size={17}/> سجل القبوض</Link><Link to="/reports"><WalletCards size={17}/> تقرير حساب العميل</Link></div></main>
      </div>
    </div>
  </>;
}

function isDebtIncrease(type: string) {
  const n = (type || "").trim().toLowerCase();
  return ["credit", "income", "payment", "receipt", "deposit", "قبض", "دائن", "وارد", "ايداع", "إيداع"].some((x) => n.includes(x));
}
function formatAmount(value: number) { return new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 2 }).format(value || 0); }
