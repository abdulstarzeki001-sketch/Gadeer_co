import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { money, type Receipt, useLocalCollection } from "@/lib/accounting-store";
import { PageHead, Stat } from "./customers";
export const Route = createFileRoute("/_authenticated/receipts")({ component: ReceiptsPage });
function ReceiptsPage() {
  const { items, add, remove } = useLocalCollection<Receipt>("receipts");
  const [f, setF] = useState({
    customer: "",
    amount: "",
    type: "قبض" as "قبض" | "صرف",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add({ ...f, amount: Number(f.amount) });
    setF({ ...f, customer: "", amount: "", note: "" });
  };
  const received = items.filter((x) => x.type === "قبض").reduce((s, x) => s + x.amount, 0);
  const paid = items.filter((x) => x.type === "صرف").reduce((s, x) => s + x.amount, 0);
  return (
    <div className="accounting-page">
      <PageHead
        title="سندات القبض والصرف"
        text="وثّق كل حركة مالية واربطها باسم العميل وتاريخها."
      />
      <div className="summary-grid">
        <Stat label="المقبوضات" value={money(received)} />
        <Stat label="المدفوعات" value={money(paid)} />
        <Stat label="الصافي" value={money(received - paid)} />
      </div>
      <section className="panel">
        <h2>سند جديد</h2>
        <form className="data-form" onSubmit={submit}>
          <input
            required
            placeholder="اسم العميل"
            value={f.customer}
            onChange={(e) => setF({ ...f, customer: e.target.value })}
          />
          <select
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value as "قبض" | "صرف" })}
          >
            <option>قبض</option>
            <option>صرف</option>
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
          <button>حفظ السند</button>
        </form>
      </section>
      <section className="panel">
        <h2>الحركات المالية</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>العميل</th>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>{x.customer}</td>
                  <td>
                    <span className={`status-pill ${x.type === "قبض" ? "success" : "expense"}`}>
                      {x.type}
                    </span>
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
                    لا توجد سندات
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
