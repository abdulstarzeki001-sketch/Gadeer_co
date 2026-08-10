import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "العملاء | لوحة التحكم" },
      {
        name: "description",
        content: "صفحة إدارة العملاء وحفظ بياناتهم المرتبطة بحسابك في النظام.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <div style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>العملاء</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.7 }}>
          واجهة مهنية لإدارة العملاء، إضافة بيانات جديدة، ومتابعة معاملات الحساب المرتبطة بحسابك.
        </p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <section
          style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>إضافة عميل جديد</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            أنشئ ملف عميل جديد مرتبط بحساب المستخدم مع التفاصيل الأساسية مثل الاسم، رقم الهاتف،
            ومعلومات الشركة.
          </p>
        </section>

        <section
          style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>قائمة العملاء</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            تصفح العملاء المرتبطين بحسابك واعرض ملخصات الحسابات الخاصة بكل عميل في المستقبل.
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
          <Link
            to="/wasl"
            style={{
              display: "inline-flex",
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              color: "#111827",
              textDecoration: "none",
            }}
          >
            إصدار وصل جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
