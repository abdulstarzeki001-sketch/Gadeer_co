import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Banknote, FilePenLine, History, ReceiptText, RefreshCcw, Trash2, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/receipts")({
  head: () => ({
    meta: [
      { title: "الوصولات | لوحة التحكم" },
      { name: "description", content: "عرض وحذف وصولات العملاء مع ربط العمليات بحساب المستخدم." },
    ],
  }),
  component: ReceiptsPage,
});

type ReceiptRow = {
  id: string;
  document_number: string;
  company_name: string;
  driver_name: string | null;
  status: string;
  created_at: string;
};

function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase
      .from("documents")
      .select("id,document_number,company_name,driver_name,status,created_at")
      .order("created_at", { ascending: false });
    if (loadError) setError(`تعذر تحميل الوصولات: ${loadError.message}`);
    else setReceipts((data ?? []) as ReceiptRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReceipts();
  }, [loadReceipts]);

  async function deleteReceipt(receipt: ReceiptRow) {
    const confirmed = window.confirm(
      `هل تريد حذف الوصلة رقم ${receipt.document_number}؟\n\nسيتم حذف الوصلة وعناصرها نهائيًا. الحركات المالية السابقة ستبقى محفوظة بدون ربط مباشر بالوصلة.`,
    );
    if (!confirmed) return;

    setDeletingId(receipt.id);
    setError(null);
    setMessage(null);

    const { error: deleteError } = await supabase.from("documents").delete().eq("id", receipt.id);
    if (deleteError) {
      setError(`تعذر حذف الوصلة: ${deleteError.message}`);
      setDeletingId(null);
      return;
    }

    setReceipts((current) => current.filter((item) => item.id !== receipt.id));
    setMessage(`تم حذف الوصلة ${receipt.document_number} بنجاح.`);
    setDeletingId(null);
  }

  return (
    <>
      <style>{`
        .receipts-page{--surface:#fff;--surface2:#f8fafc;--text:#17233f;--muted:#667085;--line:#d9dfeb;--accent:#c9a14a;--accent2:#e7c56d;--shadow:0 16px 38px rgba(15,23,42,.1);width:min(100%,1000px);margin:0 auto;padding:24px 14px 110px;color:var(--text)!important}
        html[data-ghadeer-theme="dark"] .receipts-page{--surface:#052044;--surface2:#062653;--text:#fff;--muted:#9eabc2;--line:rgba(20,126,231,.46);--accent:#f4c75d;--accent2:#ffda76;--shadow:0 20px 52px rgba(0,0,0,.28)}
        .receipts-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px;border:1px solid var(--line);border-radius:24px;background:var(--surface)!important;box-shadow:var(--shadow);overflow:hidden;position:relative}.receipts-hero h1{margin:0 0 7px;color:var(--text)!important;font-size:clamp(1.6rem,5vw,2.25rem)}.receipts-hero p{margin:0;color:var(--muted)!important;line-height:1.85}.receipts-hero-icon{flex:0 0 auto;width:70px;height:70px;display:grid;place-items:center;border-radius:21px;color:var(--accent);background:var(--surface2)!important;border:1px solid var(--line)}
        html[data-ghadeer-theme="dark"] .receipts-hero{background:radial-gradient(circle at 12% 18%,rgba(17,140,255,.2),transparent 30%),linear-gradient(145deg,#05204a,#03162f)!important}
        .receipts-grid{display:grid;gap:16px;margin-top:18px}.receipt-panel{display:grid;grid-template-columns:56px minmax(0,1fr);gap:16px;align-items:start;padding:20px;border:1px solid var(--line);border-radius:20px;background:var(--surface)!important;box-shadow:var(--shadow)}html[data-ghadeer-theme="dark"] .receipt-panel{background:linear-gradient(145deg,rgba(6,31,66,.96),rgba(3,22,50,.97))!important}.receipt-panel-icon{width:56px;height:56px;display:grid;place-items:center;border-radius:17px;color:var(--accent);background:var(--surface2)!important;border:1px solid var(--line)}.receipt-panel h2{margin:0 0 8px;color:var(--text)!important;font-size:1.08rem}.receipt-panel p{margin:0;color:var(--muted)!important;line-height:1.8}.receipt-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:15px}.receipt-action{min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 14px;border-radius:13px;font-weight:900;text-decoration:none}.receipt-action.primary{color:#07142f!important;border:1px solid rgba(255,226,139,.72);background:linear-gradient(135deg,#c99b35,var(--accent),var(--accent2))!important}.receipt-action.secondary{color:var(--text)!important;border:1px solid var(--line);background:var(--surface2)!important}
        .receipt-list-panel{display:block}.receipt-list-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:13px}.receipt-list-head h2{display:flex;align-items:center;gap:8px;margin:0}.receipt-refresh{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--line)!important;border-radius:11px!important;background:var(--surface2)!important;color:var(--text)!important;cursor:pointer}.receipt-list{display:grid;gap:9px}.receipt-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 14px;border:1px solid var(--line);border-radius:15px;background:var(--surface2)!important}.receipt-row-title{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-weight:900}.receipt-number{color:var(--accent)!important}.receipt-row-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;color:var(--muted)!important;font-size:.82rem}.receipt-delete{width:44px;height:44px;display:grid;place-items:center;border-radius:13px!important;border:1px solid rgba(239,68,68,.3)!important;background:rgba(239,68,68,.08)!important;color:#ef4444!important;cursor:pointer}.receipt-delete:disabled{opacity:.5;cursor:not-allowed}.receipt-empty{padding:26px 8px;text-align:center;color:var(--muted)!important}.receipt-message{margin:12px 0 0;padding:10px 12px;border-radius:12px}.receipt-message.ok{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22c55e!important}.receipt-message.error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444!important}
        .receipts-footer-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.receipts-footer-actions a{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--line);border-radius:13px;background:var(--surface2)!important;color:var(--text)!important;text-decoration:none;font-weight:800}html[data-ghadeer-theme="dark"] .receipts-page :is(h1,h2,h3,p,span,small,strong,a){color:#fff!important}html[data-ghadeer-theme="dark"] .receipts-page .receipt-action.primary{color:#07142f!important}html[data-ghadeer-theme="dark"] .receipts-page .receipt-number{color:var(--accent)!important}html[data-ghadeer-theme="dark"] .receipts-page .receipt-delete{color:#ff8c96!important}
        @media(max-width:620px){.receipts-page{padding-inline:4px}.receipts-hero{padding:18px 14px}.receipts-hero-icon{width:58px;height:58px}.receipt-panel{grid-template-columns:46px minmax(0,1fr);padding:14px 10px;gap:10px}.receipt-panel-icon{width:46px;height:46px;border-radius:14px}.receipt-actions{display:grid;grid-template-columns:1fr}.receipt-action{width:100%}.receipt-list-panel{padding:14px 8px}.receipt-row{padding:12px 9px}.receipt-delete{width:42px;height:42px}}
      `}</style>

      <div className="receipts-page" dir="rtl">
        <section className="receipts-hero">
          <div><h1>الوصولات</h1><p>إدارة الوصولات وقبوض العملاء ومتابعة العمليات المالية من مكان واحد.</p></div>
          <div className="receipts-hero-icon" aria-hidden="true"><ReceiptText size={34} strokeWidth={1.9}/></div>
        </section>

        <div className="receipts-grid">
          <section className="receipt-panel">
            <div className="receipt-panel-icon"><Banknote size={25}/></div>
            <div><h2>قبوض العملاء</h2><p>سجّل أي مبلغ تستلمه من العميل ليتم تنزيله مباشرة من رصيده، أو راجع سجل جميع القبوض السابقة.</p><div className="receipt-actions"><Link to="/collections" className="receipt-action primary"><Banknote size={18}/> قبض مبلغ من عميل</Link><Link to="/collections-history" className="receipt-action secondary"><History size={18}/> سجل القبوض</Link></div></div>
          </section>

          <section className="receipt-panel receipt-list-panel">
            <div className="receipt-list-head"><h2><WalletCards size={21}/> الوصولات الحالية</h2><button type="button" className="receipt-refresh" disabled={loading} onClick={()=>void loadReceipts()}><RefreshCcw size={15}/> تحديث</button></div>
            {error ? <div className="receipt-message error">{error}</div> : null}
            {message ? <div className="receipt-message ok">{message}</div> : null}
            {loading ? <div className="receipt-empty">جارٍ تحميل الوصولات...</div> : receipts.length===0 ? <div className="receipt-empty">لا توجد وصولات محفوظة.</div> : <div className="receipt-list">{receipts.map((receipt)=><article className="receipt-row" key={receipt.id}><div><div className="receipt-row-title"><span className="receipt-number">#{receipt.document_number}</span><span>{receipt.company_name}</span></div><div className="receipt-row-meta">{receipt.driver_name ? <span>السائق: {receipt.driver_name}</span> : null}<span>الحالة: {receipt.status}</span><span>{new Intl.DateTimeFormat("en-GB").format(new Date(receipt.created_at))}</span></div></div><button type="button" className="receipt-delete" aria-label={`حذف الوصلة ${receipt.document_number}`} title="حذف الوصلة" disabled={deletingId===receipt.id} onClick={()=>void deleteReceipt(receipt)}>{deletingId===receipt.id ? "…" : <Trash2 size={19}/>}</button></article>)}</div>}
          </section>

          <section className="receipt-panel"><div className="receipt-panel-icon"><FilePenLine size={25}/></div><div><h2>إدارة الوصلات</h2><p>يمكنك الآن مراجعة الوصلات المحفوظة وحذف أي وصلة غير مطلوبة مباشرة من القائمة أعلاه.</p></div></section>
        </div>

        <div className="receipts-footer-actions"><Link to="/">العودة إلى لوحة التحكم</Link><Link to="/reports"><WalletCards size={17}/> تقارير العملاء</Link></div>
      </div>
    </>
  );
}
