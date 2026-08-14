import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowRight, MapPin, Phone, Plus, RefreshCcw, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "العملاء | لوحة التحكم" },
      { name: "description", content: "إدارة العملاء وحفظ بياناتهم في النظام." },
    ],
  }),
  component: CustomersPage,
});

type Trader = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

function CustomersPage() {
  const [customers, setCustomers] = useState<Trader[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase
      .from("traders")
      .select("id,name,phone,address,notes,created_at")
      .order("created_at", { ascending: false });

    if (loadError) setError(`تعذر تحميل العملاء: ${loadError.message}`);
    else setCustomers((data ?? []) as Trader[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("اسم العميل مطلوب.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("انتهت جلسة الدخول. سجّل الدخول مرة أخرى ثم حاول الحفظ.");
      setSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("traders")
      .insert({
        name: cleanName,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        created_by: authData.user.id,
      })
      .select("id,name,phone,address,notes,created_at")
      .single();

    if (insertError) {
      setError(`تعذر حفظ العميل: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setCustomers((current) => [data as Trader, ...current]);
    setName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setSuccess("تم حفظ العميل بنجاح.");
    setSaving(false);
  }

  return (
    <div className="customers-page" dir="rtl">
      <style>{`
        .customers-page{width:min(100%,1050px);margin:0 auto;padding:22px 14px 110px;color:var(--gh-text,#17233f)}
        .customers-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.customers-head h1{margin:0 0 6px}.customers-head p{margin:0;color:var(--gh-muted,#667085)}
        .customers-grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:18px}.customers-card{border:1px solid var(--gh-line,#d9dfeb);border-radius:20px;padding:18px;background:var(--gh-panel,#fff);box-shadow:0 12px 30px rgba(15,23,42,.08)}
        .customers-card h2{display:flex;align-items:center;gap:8px;margin:0 0 16px;font-size:1.08rem}.customer-form{display:grid;gap:12px}.customer-field label{display:block;margin-bottom:6px;font-weight:800;font-size:.86rem}.customer-field input,.customer-field textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--gh-line,#d9dfeb);border-radius:12px;background:var(--gh-panel2,#f8fafc);color:inherit}.customer-field textarea{min-height:92px;resize:vertical}
        .customer-save{display:flex;justify-content:center;align-items:center;gap:8px;padding:12px 16px;border:0;border-radius:13px;cursor:pointer;font-weight:900}.customer-save:disabled{opacity:.55;cursor:not-allowed}.customer-message{padding:10px 12px;border-radius:12px;font-size:.9rem}.customer-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}.customer-success{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
        .customers-list-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.customers-list-head h2{margin:0}.customer-refresh{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--gh-line,#d9dfeb);border-radius:10px;background:transparent;color:inherit;cursor:pointer}.customer-list{display:grid;gap:10px}.customer-item{padding:13px;border:1px solid var(--gh-line,#d9dfeb);border-radius:14px;background:var(--gh-panel2,#f8fafc)}.customer-item strong{display:block;margin-bottom:6px}.customer-meta{display:flex;gap:12px;flex-wrap:wrap;color:var(--gh-muted,#667085);font-size:.86rem}.customer-meta span{display:inline-flex;align-items:center;gap:5px}.customer-notes{margin:8px 0 0;color:var(--gh-muted,#667085);font-size:.86rem}.customers-empty{text-align:center;padding:35px 10px;color:var(--gh-muted,#667085)}.customers-back{display:inline-flex;align-items:center;gap:7px;text-decoration:none;color:inherit}
        @media(max-width:760px){.customers-grid{grid-template-columns:1fr}.customers-head{align-items:flex-start;flex-direction:column}}
      `}</style>

      <header className="customers-head">
        <div><h1>العملاء</h1><p>أضف العميل واحفظ بياناته مباشرة في Supabase.</p></div>
        <Link to="/" className="customers-back"><ArrowRight size={18}/> لوحة التحكم</Link>
      </header>

      <div className="customers-grid">
        <section className="customers-card">
          <h2><Plus size={20}/> إضافة عميل جديد</h2>
          <form className="customer-form" onSubmit={saveCustomer}>
            <div className="customer-field"><label htmlFor="customer-name">اسم العميل *</label><input id="customer-name" value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" required /></div>
            <div className="customer-field"><label htmlFor="customer-phone">رقم الهاتف</label><input id="customer-phone" type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} autoComplete="tel" /></div>
            <div className="customer-field"><label htmlFor="customer-address">العنوان</label><input id="customer-address" value={address} onChange={(e)=>setAddress(e.target.value)} autoComplete="street-address" /></div>
            <div className="customer-field"><label htmlFor="customer-notes">ملاحظات</label><textarea id="customer-notes" value={notes} onChange={(e)=>setNotes(e.target.value)} /></div>
            {error ? <div className="customer-message customer-error">{error}</div> : null}
            {success ? <div className="customer-message customer-success">{success}</div> : null}
            <button className="customer-save" type="submit" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ العميل"}</button>
          </form>
        </section>

        <section className="customers-card">
          <div className="customers-list-head"><h2><Users size={20}/> قائمة العملاء</h2><button type="button" className="customer-refresh" onClick={()=>void loadCustomers()} disabled={loading}><RefreshCcw size={15}/> تحديث</button></div>
          {loading ? <div className="customers-empty">جارٍ تحميل العملاء...</div> : customers.length === 0 ? <div className="customers-empty">لا يوجد عملاء محفوظون بعد.</div> : <div className="customer-list">{customers.map((customer)=><article className="customer-item" key={customer.id}><strong><User size={15}/> {customer.name}</strong><div className="customer-meta">{customer.phone ? <span><Phone size={14}/>{customer.phone}</span> : null}{customer.address ? <span><MapPin size={14}/>{customer.address}</span> : null}</div>{customer.notes ? <p className="customer-notes">{customer.notes}</p> : null}</article>)}</div>}
        </section>
      </div>
    </div>
  );
}
