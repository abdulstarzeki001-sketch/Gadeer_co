import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import { money, type Customer, useLocalCollection } from "@/lib/accounting-store";

export const Route = createFileRoute("/_authenticated/customers")({ component: CustomersPage });

function CustomersPage() {
  const { items, add, remove } = useLocalCollection<Customer>("customers");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", company: "", balance: "0" });
  const filtered = useMemo(
    () => items.filter((x) => `${x.name} ${x.company} ${x.phone}`.includes(query)),
    [items, query],
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add({ ...form, balance: Number(form.balance) || 0 });
    setForm({ name: "", phone: "", company: "", balance: "0" });
  };
  return (
    <div className="accounting-page">
      <PageHead
        title="إدارة العملاء"
        text="ملفات العملاء والأرصدة ومعلومات التواصل في مكان واحد."
      />
      <div className="summary-grid">
        <Stat label="إجمالي العملاء" value={String(items.length)} />
        <Stat label="إجمالي الأرصدة" value={money(items.reduce((s, x) => s + x.balance, 0))} />
      </div>
      <section className="panel">
        <h2>عميل جديد</h2>
        <form className="data-form" onSubmit={submit}>
          <input
            required
            placeholder="اسم العميل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            placeholder="رقم الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="الشركة"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <input
            type="number"
            placeholder="الرصيد الافتتاحي"
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: e.target.value })}
          />
          <button>حفظ العميل</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-title">
          <h2>سجل العملاء</h2>
          <input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>العميل</th>
                <th>الشركة</th>
                <th>الهاتف</th>
                <th>الرصيد</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.name}</strong>
                  </td>
                  <td>{x.company || "—"}</td>
                  <td dir="ltr">{x.phone}</td>
                  <td>{money(x.balance)}</td>
                  <td>
                    <button className="danger-link" onClick={() => remove(x.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    لا توجد بيانات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export function PageHead({ title, text }: { title: string; text: string }) {
  return (
    <header className="page-heading">
      <div>
        <span>نظام الغدير المحاسبي</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </header>
  );
}
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
