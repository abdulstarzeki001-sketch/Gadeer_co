import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calculator, CreditCard, FileText, ReceiptText, TrendingUp, UserRound, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "الحسابات والمعاملات | لوحة التحكم" },
      { name: "description", content: "تسجيل معاملات العملاء وحساب الإجمالي والمتبقي والتكلفة والربح وحفظها في كشف الحساب." },
    ],
  }),
  component: AccountsPage,
});

type Trader = { id: string; name: string; phone: string | null };
type Account = { id: string; user_id: string; name: string; balance: number; currency: string; status: string; description: string | null; created_at: string; updated_at: string };

type OperationForm = {
  service: string;
  quantity: string;
  unitPrice: string;
  paidAmount: string;
  unitCost: string;
  paymentMethod: string;
  note: string;
};

const EMPTY_OPERATION: OperationForm = {
  service: "",
  quantity: "1",
  unitPrice: "",
  paidAmount: "0",
  unitCost: "0",
  paymentMethod: "نقداً",
  note: "",
};

function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [traderId, setTraderId] = useState("");
  const [operation, setOperation] = useState<OperationForm>(EMPTY_OPERATION);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingOperation, setSavingOperation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("IQD");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("0");
  const [editStatus, setEditStatus] = useState("active");
  const [editDescription, setEditDescription] = useState("");

  const quantity = Math.max(0, Number(operation.quantity) || 0);
  const unitPrice = Math.max(0, Number(operation.unitPrice) || 0);
  const paidAmount = Math.max(0, Number(operation.paidAmount) || 0);
  const unitCost = Math.max(0, Number(operation.unitCost) || 0);
  const total = quantity * unitPrice;
  const costTotal = quantity * unitCost;
  const remaining = Math.max(0, total - paidAmount);
  const profit = total - costTotal;
  const selectedTrader = traders.find((trader) => trader.id === traderId) ?? null;

  useEffect(() => { void loadPage(); }, []);

  async function loadPage() {
    setLoading(true);
    setError(null);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("تعذر الحصول على بيانات المستخدم. الرجاء تسجيل الدخول مجددًا.");
      setLoading(false);
      return;
    }

    const [accountsResult, tradersResult, companyResult] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("traders").select("id,name,phone").order("name"),
      supabase.from("companies").select("id").limit(1).maybeSingle(),
    ]);

    if (accountsResult.error) setError(accountsResult.error.message);
    else setAccounts((accountsResult.data ?? []) as Account[]);
    if (!tradersResult.error) setTraders((tradersResult.data ?? []) as Trader[]);
    if (!companyResult.error && companyResult.data?.id) setCompanyId(companyResult.data.id);
    setLoading(false);
  }

  const setOperationField = (key: keyof OperationForm, value: string) =>
    setOperation((current) => ({ ...current, [key]: value }));

  async function saveAccountingOperation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTrader) return setError("اختر العميل أولاً.");
    if (!operation.service.trim()) return setError("أدخل اسم الخدمة أو البيان.");
    if (quantity <= 0 || unitPrice <= 0) return setError("الكمية وسعر الوحدة يجب أن يكونا أكبر من صفر.");
    if (paidAmount > total) return setError("المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي الفاتورة.");
    if (!companyId) return setError("تعذر تحديد حساب الشركة. أعد تحميل الصفحة.");

    setSavingOperation(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("انتهت جلسة الدخول.");

      const operationNumber = `ACC-${Date.now()}`;
      const commonDetails = {
        accounting_operation: true,
        operationNumber,
        customerName: selectedTrader.name,
        service: operation.service.trim(),
        quantity,
        unitPrice,
        total,
        paidAmount,
        remaining,
        unitCost,
        costTotal,
        profit,
        paymentMethod: operation.paymentMethod,
        note: operation.note.trim() || null,
      };

      const rows = [
        {
          company_id: companyId,
          trader_id: selectedTrader.id,
          document_number: operationNumber,
          type: "charge",
          amount: total,
          description: JSON.stringify({ ...commonDetails, entryKind: "invoice" }),
          cargo_typedetails: operation.service.trim(),
          created_by: userData.user.id,
        },
      ];

      if (paidAmount > 0) {
        rows.push({
          company_id: companyId,
          trader_id: selectedTrader.id,
          document_number: operationNumber,
          type: "receipt",
          amount: paidAmount,
          description: JSON.stringify({ ...commonDetails, entryKind: "payment" }),
          cargo_typedetails: operation.paymentMethod,
          created_by: userData.user.id,
        });
      }

      const { error: insertError } = await supabase.from("transactions").insert(rows);
      if (insertError) throw insertError;

      setSuccess(`تم حفظ العملية ${operationNumber} على حساب ${selectedTrader.name}. الإجمالي ${money(total)}، المدفوع ${money(paidAmount)}، المتبقي ${money(remaining)}، وصافي الربح ${money(profit)}.`);
      setOperation(EMPTY_OPERATION);
      setTraderId("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر حفظ العملية المحاسبية.");
    } finally {
      setSavingOperation(false);
    }
  }

  async function handleAddAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return setError("تعذر الحصول على بيانات المستخدم لإنشاء الحساب.");
    const { error: insertError } = await supabase.from("accounts").insert({ user_id: userData.user.id, name, balance: parseFloat(balance) || 0, currency, status, description: description || null });
    if (insertError) return setError(insertError.message);
    setName(""); setBalance("0"); setCurrency("IQD"); setStatus("active"); setDescription("");
    await loadPage();
  }

  function handleEdit(account: Account) {
    setEditingId(account.id); setEditBalance(account.balance.toString()); setEditStatus(account.status); setEditDescription(account.description ?? "");
  }

  async function handleSaveEdit(accountId: string) {
    setError(null);
    const { error: updateError } = await supabase.from("accounts").update({ balance: parseFloat(editBalance) || 0, status: editStatus, description: editDescription || null, updated_at: new Date().toISOString() }).eq("id", accountId);
    if (updateError) return setError(updateError.message);
    setEditingId(null); await loadPage();
  }

  async function handleDelete(accountId: string) {
    if (!window.confirm("هل تريد حذف هذا الحساب نهائيًا؟")) return;
    const { error: deleteError } = await supabase.from("accounts").delete().eq("id", accountId);
    if (deleteError) return setError(deleteError.message);
    if (editingId === accountId) setEditingId(null);
    await loadPage();
  }

  const operationCards = useMemo(() => [
    { label: "إجمالي الفاتورة", value: money(total), icon: FileText, cls: "gold" },
    { label: "المبلغ المدفوع", value: money(paidAmount), icon: ReceiptText, cls: "green" },
    { label: "المتبقي على العميل", value: money(remaining), icon: WalletCards, cls: "red" },
    { label: "صافي الربح", value: money(profit), icon: TrendingUp, cls: profit >= 0 ? "green" : "red" },
  ], [total, paidAmount, remaining, profit]);

  return (
    <div className="accounting-page" dir="rtl">
      <style>{`
        .accounting-page{width:min(100%,1120px);margin:0 auto;padding:20px 10px 110px;color:var(--gh-text,#17233f)}
        .accounting-hero{padding:22px;border:1px solid var(--gh-line,#d9dfeb);border-radius:22px;background:linear-gradient(145deg,var(--gh-panel,#fff),var(--gh-panel2,#f8fafc));margin-bottom:16px}.accounting-hero h1{margin:0 0 7px}.accounting-hero p{margin:0;color:var(--gh-muted,#667085);line-height:1.8}
        .operation-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.8fr);gap:14px}.accounting-card{border:1px solid var(--gh-line,#d9dfeb);border-radius:20px;background:var(--gh-panel,#fff);padding:18px;box-shadow:0 14px 32px rgba(15,23,42,.08)}.accounting-card h2{margin:0 0 15px;display:flex;align-items:center;gap:8px;font-size:1.08rem}
        .operation-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.operation-field{display:grid;gap:6px}.operation-field.full{grid-column:1/-1}.operation-field label{font-size:.82rem;font-weight:800}.operation-field input,.operation-field select,.operation-field textarea{width:100%;box-sizing:border-box}.operation-field textarea{min-height:88px;resize:vertical}.operation-submit{grid-column:1/-1;padding:13px 16px;border:0;border-radius:14px;font-weight:900;cursor:pointer}.operation-submit:disabled{opacity:.55;cursor:wait}
        .operation-summary{display:grid;grid-template-columns:1fr 1fr;gap:9px}.operation-stat{border:1px solid var(--gh-line,#d9dfeb);border-radius:16px;padding:13px;background:var(--gh-panel2,#f8fafc)}.operation-stat span{display:flex;align-items:center;gap:6px;color:var(--gh-muted,#667085);font-size:.76rem}.operation-stat strong{display:block;margin-top:8px;font-size:1.15rem;direction:ltr;text-align:right}.operation-stat.gold strong{color:var(--gh-gold,#c9a14a)}.operation-stat.green strong{color:#22c55e}.operation-stat.red strong{color:#ef4444}.cost-box{margin-top:10px;padding:12px;border-radius:14px;border:1px dashed var(--gh-line,#d9dfeb);font-size:.82rem;line-height:1.9}.cost-box b{direction:ltr;display:inline-block}
        .account-message{margin-top:12px;padding:11px 13px;border-radius:12px}.account-error{border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.08);color:#ef4444}.account-success{border:1px solid rgba(34,197,94,.35);background:rgba(34,197,94,.08);color:#16a34a}
        .manual-accounts{margin-top:16px}.manual-grid{display:grid;grid-template-columns:360px minmax(0,1fr);gap:14px}.manual-form{display:grid;gap:10px}.account-list{display:grid;gap:10px}.account-item{padding:13px;border:1px solid var(--gh-line,#d9dfeb);border-radius:15px;background:var(--gh-panel2,#f8fafc)}.account-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.account-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.account-actions button{padding:8px 11px;border-radius:10px;cursor:pointer}
        @media(max-width:820px){.operation-layout,.manual-grid{grid-template-columns:1fr}.operation-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.accounting-page{padding-inline:2px}.operation-form{grid-template-columns:1fr}.operation-field.full{grid-column:auto}.operation-submit{grid-column:auto}.accounting-card{padding:13px 10px;border-radius:17px}.operation-summary{gap:6px}.operation-stat{padding:11px 8px}.operation-stat strong{font-size:1rem}}
      `}</style>

      <section className="accounting-hero">
        <h1>الحسابات والمعاملات</h1>
        <p>سجّل العملية مرة واحدة، والنظام يحسب الفاتورة والمدفوع والمتبقي والتكلفة وصافي الربح ويحفظ الحركات على حساب العميل.</p>
      </section>

      <div className="operation-layout">
        <section className="accounting-card">
          <h2><Calculator size={20}/> معاملة محاسبية جديدة</h2>
          <form className="operation-form" onSubmit={saveAccountingOperation}>
            <div className="operation-field full"><label>العميل</label><select required value={traderId} onChange={(e)=>setTraderId(e.target.value)}><option value="">-- اختر العميل --</option>{traders.map((trader)=><option key={trader.id} value={trader.id}>{trader.name}{trader.phone?` - ${trader.phone}`:""}</option>)}</select></div>
            <div className="operation-field full"><label>الخدمة / البيان</label><input required value={operation.service} onChange={(e)=>setOperationField("service",e.target.value)} placeholder="مثال: حمولة عراقية / خدمة تخليص"/></div>
            <div className="operation-field"><label>الكمية</label><input type="number" min="0.01" step="0.01" value={operation.quantity} onChange={(e)=>setOperationField("quantity",e.target.value)}/></div>
            <div className="operation-field"><label>سعر الوحدة</label><input type="number" min="0" step="0.01" value={operation.unitPrice} onChange={(e)=>setOperationField("unitPrice",e.target.value)} placeholder="0"/></div>
            <div className="operation-field"><label>المبلغ المدفوع</label><input type="number" min="0" step="0.01" value={operation.paidAmount} onChange={(e)=>setOperationField("paidAmount",e.target.value)} placeholder="0"/></div>
            <div className="operation-field"><label>تكلفة الوحدة عليك</label><input type="number" min="0" step="0.01" value={operation.unitCost} onChange={(e)=>setOperationField("unitCost",e.target.value)} placeholder="0"/></div>
            <div className="operation-field full"><label>طريقة الدفع</label><select value={operation.paymentMethod} onChange={(e)=>setOperationField("paymentMethod",e.target.value)}><option>نقداً</option><option>تحويل بنكي</option><option>حوالة</option><option>آجل</option><option>أخرى</option></select></div>
            <div className="operation-field full"><label>ملاحظات</label><textarea value={operation.note} onChange={(e)=>setOperationField("note",e.target.value)} placeholder="أي تفاصيل إضافية للعملية"/></div>
            <button className="operation-submit" type="submit" disabled={savingOperation}>{savingOperation?"جارٍ حفظ الفاتورة والحركة...":"حفظ العملية في حساب العميل"}</button>
          </form>
          {error?<div className="account-message account-error">{error}</div>:null}
          {success?<div className="account-message account-success">{success}</div>:null}
        </section>

        <aside className="accounting-card">
          <h2><CreditCard size={20}/> ملخص العملية</h2>
          <div className="operation-summary">{operationCards.map(({label,value,icon:Icon,cls})=><div className={`operation-stat ${cls}`} key={label}><span><Icon size={15}/>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="cost-box">التكلفة الإجمالية: <b>{money(costTotal)}</b><br/>طريقة الدفع: <b>{operation.paymentMethod}</b><br/>العميل: <b>{selectedTrader?.name||"—"}</b></div>
          <Link to="/reports" style={{display:"flex",justifyContent:"center",marginTop:12,padding:"11px",borderRadius:12,textDecoration:"none",border:"1px solid var(--gh-line)"}}><UserRound size={17}/> &nbsp;فتح تقارير العملاء</Link>
        </aside>
      </div>

      <section className="manual-accounts">
        <div className="manual-grid">
          <div className="accounting-card">
            <h2>إضافة حساب مالي مستقل</h2>
            <form className="manual-form" onSubmit={handleAddAccount}>
              <label>اسم الحساب<input required value={name} onChange={(e)=>setName(e.target.value)}/></label>
              <label>الرصيد الابتدائي<input type="number" step="0.01" required value={balance} onChange={(e)=>setBalance(e.target.value)}/></label>
              <label>العملة<select value={currency} onChange={(e)=>setCurrency(e.target.value)}><option value="IQD">IQD</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
              <label>الحالة<select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="active">نشط</option><option value="pending">قيد الانتظار</option><option value="closed">مغلق</option></select></label>
              <label>ملاحظات<textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3}/></label>
              <button type="submit">حفظ الحساب</button>
            </form>
          </div>

          <div className="accounting-card">
            <h2>قائمة الحسابات المستقلة</h2>
            {loading?<div>جارٍ التحميل...</div>:accounts.length===0?<div>لا توجد حسابات حتى الآن.</div>:<div className="account-list">{accounts.map((account)=><div className="account-item" key={account.id}><div className="account-head"><div><strong>{account.name}</strong><div>{account.currency} • {account.status}</div></div><strong>{money(account.balance)}</strong></div>{editingId===account.id?<div className="manual-form" style={{marginTop:10}}><input type="number" step="0.01" value={editBalance} onChange={(e)=>setEditBalance(e.target.value)}/><select value={editStatus} onChange={(e)=>setEditStatus(e.target.value)}><option value="active">نشط</option><option value="pending">قيد الانتظار</option><option value="closed">مغلق</option></select><textarea value={editDescription} onChange={(e)=>setEditDescription(e.target.value)}/><div className="account-actions"><button onClick={()=>void handleSaveEdit(account.id)}>حفظ</button><button onClick={()=>setEditingId(null)}>إلغاء</button></div></div>:<><div style={{marginTop:7}}>{account.description||"بدون ملاحظات"}</div><div className="account-actions"><button onClick={()=>handleEdit(account)}>تعديل</button><button onClick={()=>void handleDelete(account.id)}>حذف</button></div></>}</div>)}</div>}
          </div>
        </div>
      </section>
    </div>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}
