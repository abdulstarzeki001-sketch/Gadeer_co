import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { money, type Expense, useLocalCollection } from "@/lib/accounting-store";
import { PageHead, Stat } from "./customers";
export const Route = createFileRoute("/_authenticated/expenses")({ component: ExpensesPage });
function ExpensesPage() {
  const { items, add, remove } = useLocalCollection<Expense>("expenses");
  const [f, setF] = useState({
    title: "",
    category: "تشغيل",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add({ ...f, amount: Number(f.amount) });
    setF({ ...f, title: "", amount: "", note: "" });
  };
  return (
    <div className="accounting-page">
      <PageHead
        title="المصروفات"
        text="سجل المصروفات اليومية وصنّفها للحصول على صورة مالية دقيقة."
      />
      <div className="summary-grid">
        <Stat label="عدد المصروفات" value={String(items.length)} />
        <Stat label="إجمالي المصروفات" value={money(items.reduce((s, x) => s + x.amount, 0))} />
      </div>
      <section className="panel">
        <h2>تسجيل مصروف</h2>
        <form className="data-form" onSubmit={submit}>
          <input
            required
            placeholder="البيان"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option>تشغيل</option>
            <option>وقود</option>
            <option>نقل</option>
            <option>رواتب</option>
            <option>أخرى</option>
          </select>
          <input
            required
            type="number"
            placeholder="المبلغ"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
          />
          <input
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
          <button>إضافة المصروف</button>
        </form>
      </section>
      <section className="panel">
        <h2>سجل المصروفات</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>البيان</th>
                <th>التصنيف</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>{x.title}</td>
                  <td>
                    <span className="status-pill">{x.category}</span>
                  </td>
                  <td>{x.date}</td>
                  <td>{money(x.amount)}</td>
                  <td>
                    <button className="danger-link" onClick={() => remove(x.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    لا توجد مصروفات
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
