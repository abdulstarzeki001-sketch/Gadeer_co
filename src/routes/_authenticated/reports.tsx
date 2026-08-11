import { createFileRoute } from "@tanstack/react-router";
import {
  money,
  type Customer,
  type Expense,
  type Receipt,
  useLocalCollection,
} from "@/lib/accounting-store";
import { PageHead, Stat } from "./customers";
export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });
function ReportsPage() {
  const { items: c } = useLocalCollection<Customer>("customers");
  const { items: r } = useLocalCollection<Receipt>("receipts");
  const { items: e } = useLocalCollection<Expense>("expenses");
  const income = r.filter((x) => x.type === "قبض").reduce((s, x) => s + x.amount, 0);
  const out =
    r.filter((x) => x.type === "صرف").reduce((s, x) => s + x.amount, 0) +
    e.reduce((s, x) => s + x.amount, 0);
  const max = Math.max(income, out, 1);
  return (
    <div className="accounting-page">
      <PageHead title="التقارير المالية" text="مؤشرات واضحة تساعدك على متابعة أداء الشركة." />
      <div className="summary-grid">
        <Stat label="العملاء" value={String(c.length)} />
        <Stat label="الحركات" value={String(r.length + e.length)} />
        <Stat label="صافي التدفق" value={money(income - out)} />
      </div>
      <section className="panel">
        <h2>تحليل التدفق النقدي</h2>
        <div className="chart-row">
          <span>الإيرادات</span>
          <div>
            <i style={{ width: `${(income / max) * 100}%` }} />
          </div>
          <strong>{money(income)}</strong>
        </div>
        <div className="chart-row expense">
          <span>المصروفات</span>
          <div>
            <i style={{ width: `${(out / max) * 100}%` }} />
          </div>
          <strong>{money(out)}</strong>
        </div>
      </section>
      <section className="panel report-note">
        <h2>ملخص الإدارة</h2>
        <p>
          {income >= out
            ? "الوضع المالي موجب. استمر في متابعة التحصيل وضبط المصروفات."
            : "المصروفات أعلى من الإيرادات حالياً؛ راجع المصروفات المفتوحة وخطة التحصيل."}
        </p>
        <button onClick={() => window.print()}>طباعة التقرير</button>
      </section>
    </div>
  );
}
