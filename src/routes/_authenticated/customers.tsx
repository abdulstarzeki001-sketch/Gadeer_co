import {
  activeCustomers,
  archiveCustomer,
  ACTIVE_CUSTOMER_FILTER,
  TRASH_PREFIX,
} from "@/lib/customer-trash";
import { CustomerTrash } from "@/components/customer-trash";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  FileText,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { escapeHtml, printPdf } from "@/lib/print-pdf";

export const Route = createFileRoute("/_authenticated/customers")({
  validateSearch: (search: Record<string, unknown>): { view?: "trash" } =>
    search.view === "trash" ? { view: "trash" } : {},
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
const empty = { name: "", phone: "", address: "", notes: "" };
function CustomersPage() {
  const [items, setItems] = useState<Trader[]>([]),
    [form, setForm] = useState(empty),
    [editing, setEditing] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const { view } = Route.useSearch();
  const [showTrash, setShowTrash] = useState(view === "trash");
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await activeCustomers(supabase).order("created_at", {
      ascending: false,
    });
    if (e) setError(e.message);
    else setItems((data ?? []) as Trader[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  function edit(item: Trader) {
    setEditing(item.id);
    setForm({
      name: item.name,
      phone: item.phone ?? "",
      address: item.address ?? "",
      notes: item.notes ?? "",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("اسم العميل مطلوب.");
      return;
    }
    if (form.notes.trim().startsWith(TRASH_PREFIX)) {
      setError("هذه الصيغة محجوزة للنظام. عدّل بداية الملاحظات.");
      return;
    }
    setSaving(true);
    setError("");
    const auth = await supabase.auth.getUser();
    if (!auth.data.user) {
      setError("انتهت جلسة الدخول.");
      setSaving(false);
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };
    const result = editing
      ? await supabase
          .from("traders")
          .update(payload)
          .eq("id", editing)
          .or(ACTIVE_CUSTOMER_FILTER)
          .select("id,name,phone,address,notes,created_at")
          .single()
      : await supabase
          .from("traders")
          .insert({ ...payload, created_by: auth.data.user.id })
          .select("id,name,phone,address,notes,created_at")
          .single();
    if (result.error) setError(result.error.message);
    else {
      setMessage(editing ? "تم تحديث بيانات العميل بنجاح." : "تم إضافة العميل بنجاح.");
      setForm(empty);
      setEditing(null);
      await load();
    }
    setSaving(false);
  }
  async function remove(item: Trader) {
    if (
      !confirm(
        `نقل العميل ${item.name} وجميع حركاته ووصولاته إلى سلة المحذوفات؟ يمكنك استرجاعها لاحقًا.`,
      )
    )
      return;
    setDeleting(item.id);
    setError("");
    setMessage("");
    try {
      await archiveCustomer(supabase, item.id);
      if (editing === item.id) {
        setEditing(null);
        setForm(empty);
      }
      setMessage("تم نقل العميل وحركاته إلى سلة المحذوفات. يمكن استرجاعها كاملة.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر نقل العميل إلى السلة.");
    } finally {
      setDeleting(null);
    }
  }
  function report(item: Trader) {
    printPdf(
      `كشف حساب العميل: ${item.name}`,
      `<h2>بيانات العميل</h2><table><tr><th>الاسم</th><td>${escapeHtml(item.name)}</td></tr><tr><th>الهاتف</th><td>${escapeHtml(item.phone || "—")}</td></tr><tr><th>العنوان</th><td>${escapeHtml(item.address || "—")}</td></tr><tr><th>ملاحظات</th><td>${escapeHtml(item.notes || "—")}</td></tr></table><h2>ملاحظة</h2><p>لإصدار كشف الحساب المالي التفصيلي استخدم زر التقارير، حيث يتم عرض جميع الحركات والمبالغ المسجلة لهذا العميل.</p>`,
    );
  }
  return (
    <div className="customers-page" dir="rtl">
      <style>{`.customers-page{width:min(1100px,100%);margin:auto;padding:28px 14px 100px;color:var(--gh-text,#17233f)}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.head h1{margin:0}.head p{color:var(--gh-muted);margin:6px 0}.layout{display:grid;grid-template-columns:360px 1fr;gap:18px}.panel{background:var(--gh-panel,#fff);border:1px solid var(--gh-line,#d9dfeb);border-radius:22px;padding:20px;box-shadow:0 12px 30px #14213d0d}.panel h2{display:flex;gap:8px;align-items:center;margin:0 0 16px}.form{display:grid;gap:11px}.form label{font-weight:700;font-size:.9rem}.form input,.form textarea{display:block;width:100%;margin-top:5px;padding:11px;border:1px solid var(--gh-line,#d9dfeb);border-radius:11px;background:transparent;color:inherit}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn{border:1px solid #c9a14a;background:#c9a14a;color:#17233f;border-radius:11px;padding:10px 14px;font-weight:800;cursor:pointer}.btn.secondary{background:transparent;color:inherit}.msg{padding:10px;border-radius:10px;background:#16a34a18;color:#15803d}.error{background:#dc262618;color:#b91c1c}.list{display:grid;gap:10px}.item{border:1px solid var(--gh-line,#d9dfeb);border-radius:15px;padding:14px}.item-top{display:flex;justify-content:space-between;gap:8px}.item h3{margin:0 0 4px}.item p{margin:4px 0;color:var(--gh-muted);font-size:.9rem}.icon{vertical-align:middle;margin-left:5px}@media(max-width:760px){.layout{grid-template-columns:1fr}.head{align-items:flex-start;flex-direction:column}}`}</style>
      <header className="head">
        <div>
          <h1>إدارة العملاء</h1>
          <p>أضف، عدّل، واطبع كشف كل عميل بسهولة.</p>
        </div>
        <Link to="/" className="btn secondary">
          لوحة التحكم
        </Link>
      </header>
      <div className="actions" style={{ marginBottom: 16 }} role="group" aria-label="عرض العملاء">
        <button
          type="button"
          className="btn secondary"
          aria-pressed={!showTrash}
          onClick={() => setShowTrash(false)}
        >
          العملاء
        </button>
        <button
          type="button"
          className="btn secondary"
          aria-pressed={showTrash}
          onClick={() => setShowTrash(true)}
        >
          <Trash2 size={16} /> سلة المحذوفات
        </button>
      </div>
      {error && (
        <div className="msg error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="msg" role="status">
          {message}
        </div>
      )}
      {showTrash ? (
        <CustomerTrash
          onRestored={() => {
            setMessage("تم استرجاع العميل وكامل حركاته ووصولاته.");
            void load();
          }}
        />
      ) : (
        <div className="layout">
          <section className="panel">
            <h2>
              {editing ? <Pencil size={20} /> : <Plus size={20} />}{" "}
              {editing ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
            </h2>
            <form className="form" onSubmit={save}>
              {(["name", "phone", "address", "notes"] as const).map((key) => (
                <label key={key}>
                  {key === "name"
                    ? "اسم العميل *"
                    : key === "phone"
                      ? "رقم الهاتف"
                      : key === "address"
                        ? "العنوان"
                        : "ملاحظات"}
                  {key === "notes" ? (
                    <textarea
                      rows={3}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  ) : (
                    <input
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  )}
                </label>
              ))}
              <div className="actions">
                <button className="btn" disabled={saving}>
                  {saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "حفظ العميل"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setEditing(null);
                      setForm(empty);
                    }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          </section>
          <section className="panel">
            <div className="item-top">
              <h2>
                <Users size={20} /> قائمة العملاء
              </h2>
              <button className="btn secondary" onClick={() => void load()}>
                <RefreshCcw size={16} />
              </button>
            </div>
            {loading ? (
              <p>جارٍ التحميل...</p>
            ) : (
              <div className="list">
                {items.length === 0 ? (
                  <p>لا يوجد عملاء حتى الآن.</p>
                ) : (
                  items.map((item) => (
                    <article className="item" key={item.id}>
                      <div className="item-top">
                        <div>
                          <h3>
                            <User className="icon" size={17} />
                            {item.name}
                          </h3>
                          <p>
                            <Phone className="icon" size={14} />
                            {item.phone || "بدون هاتف"}
                          </p>
                          <p>
                            <MapPin className="icon" size={14} />
                            {item.address || "بدون عنوان"}
                          </p>
                        </div>
                        <div className="actions">
                          <button
                            className="btn secondary"
                            onClick={() => edit(item)}
                            title="تعديل"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => report(item)}
                            title="طباعة PDF"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            className="btn secondary"
                            disabled={deleting !== null}
                            aria-label={`نقل ${item.name} إلى سلة المحذوفات`}
                            onClick={() => void remove(item)}
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
