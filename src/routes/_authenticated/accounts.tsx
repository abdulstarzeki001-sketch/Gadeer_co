import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "كشف الحساب | لوحة التحكم" },
      { name: "description", content: "عرض كشف حساب مالي مفصل للعمليات والمعاملات المرتبطة بحسابك." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <div style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>كشف الحساب</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.7 }}>
          صفحة مرتبة تعرض حالة الحساب، الوصلات المالية، والرصيد المرتبط بحساب المستخدم الخاص بك.
        </p>
      </div>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>ملخص الحساب</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#475569" }}>
          <li>الرصيد الحالي: 0 د.ع</li>
          <li>إجمالي الوصلات: 0</li>
          <li>العمليات المفتوحة: 0</li>
        </ul>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
        <Link to="/" style={{ display: "inline-flex", padding: "10px 16px", borderRadius: 10, background: "#990707", color: "#fff", textDecoration: "none" }}>
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
