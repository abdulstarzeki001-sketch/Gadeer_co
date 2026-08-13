import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/receipts")({
  head: () => ({
    meta: [
      { title: "الوصولات | لوحة التحكم" },
      { name: "description", content: "عرض وتحرير وصولات العملاء مع ربط العمليات بحساب المستخدم." },
    ],
  }),
  component: ReceiptsPage,
});

function ReceiptsPage() {
  return (
    <div style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>الوصولات</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.7 }}>
          صفحة الوصولات المخصصة لحسابك، حيث يمكن متابعة الوصلات الصادرة والواردة لكل عميل.
        </p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <section
          style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>قبوض العملاء</h2>
          <p style={{ margin: "0 0 14px", color: "#475569" }}>
            سجّل أي مبلغ تستلمه من العميل ليتم تنزيله مباشرة من رصيده، أو راجع سجل جميع القبوض السابقة.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              to="/collections"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", borderRadius: 12, background: "#c9a14a", color: "#07142f", fontWeight: 800, textDecoration: "none" }}
            >
              <Banknote size={18} /> قبض مبلغ من عميل
            </Link>
            <Link
              to="/collections-history"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", borderRadius: 12, border: "1px solid #d1d5db", color: "#111827", fontWeight: 800, textDecoration: "none" }}
            >
              <History size={18} /> سجل القبوض
            </Link>
          </div>
        </section>

        <section
          style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>الوصولات الحالية</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            استعرض الوصلات المرتبطة بحسابك مع حالة كل وصول وبيان المشاركة المالية الخاصة بها.
          </p>
        </section>

        <section
          style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>تحرير الوصلات</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            يمكنك في هذه الصفحة تعديل بيانات الوصلات المستقبلية بعد ربطها بحساب المستخدم.
          </p>
        </section>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              padding: "10px 16px",
              borderRadius: 10,
              background: "#990707",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
