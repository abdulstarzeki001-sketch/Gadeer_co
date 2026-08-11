import { createFileRoute } from "@tanstack/react-router";
import {
  money,
  type Customer,
  type Expense,
  type Receipt,
  useLocalCollection,
} from "@/lib/accounting-store";
import { PageHead, Stat } from "./customers";
export const Route = createFileRoute("/_authenticated/accounts")({ component: AccountsPage });
function AccountsPage() {
  const { items: customers } = useLocalCollection<Customer>("customers");
  const { items: receipts } = useLocalCollection<Receipt>("receipts");
  const { items: expenses } = useLocalCollection<Expense>("expenses");
  const received = receipts.filter((x) => x.type === "قبض").reduce((s, x) => s + x.amount, 0);
  const paid =
    receipts.filter((x) => x.type === "صرف").reduce((s, x) => s + x.amount, 0) +
    expenses.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="accounting-page">
      <PageHead title="كشف الحساب" text="ملخص فوري للحركة المالية وأرصدة العملاء." />
      <div className="summary-grid">
        <Stat label="إجمالي المقبوض" value={money(received)} />
        <Stat label="إجمالي المدفوع" value={money(paid)} />
        <Stat label="الرصيد النقدي" value={money(received - paid)} />
      </div>
      <section className="panel">
        <h2>أرصدة العملاء</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>العميل</th>
                <th>الشركة</th>
                <th>الرصيد</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.name}</strong>
                  </td>
                  <td>{x.company || "—"}</td>
                  <td>{money(x.balance)}</td>
                  <td>
                    <span className="status-pill success">نشط</span>
                  </td>
                </tr>
              ))}
              {!customers.length && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    أضف العملاء لعرض كشف الحساب
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
