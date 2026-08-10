import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "المصروفات | لوحة التحكم" },
      {
        name: "description",
        content: "إدارة المصروفات وتوثيقها للمشاريع والعملاء المرتبطين بحسابك.",
      },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  return (
    <div style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>المصروفات</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.7 }}>
          صفحة لإدخال ومتابعة المصروفات التشغيلية المرتبطة بملفات الحسابات والعملاء.
        </p>
      </div>

      <section
        style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>أضف مصروف جديد</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          أضف تفاصيل المصروف من نوع السفر، الوقود، أو المصروفات الأخرى مع الربط بفواتير العميل أو
          المشروع.
        </p>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
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
  );
}
