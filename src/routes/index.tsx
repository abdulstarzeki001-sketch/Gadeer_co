import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية | شركة الغدير للنقل والتخليص الكمركي" },
      { name: "description", content: "بوابة شركة الغدير لإصدار الوثائق المؤقتة وإدارة العمليات." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="home-page" style={{ padding: "1.4rem 0 3rem" }}>
      <section
        className="hero"
        style={{ textAlign: "center", margin: "30px auto 24px", maxWidth: 720, padding: "0 16px" }}
      >
        <div
          className="badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(201,161,74,0.12)",
            border: "1px solid rgba(201,161,74,0.3)",
            color: "var(--gh-gold-dark)",
            padding: "6px 14px",
            borderRadius: 99,
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.5px",
            marginBottom: 14,
          }}
        >
          <span
            className="dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#16a34a",
              boxShadow: "0 0 8px #16a34a",
            }}
          />
          منصة إدارة العمليات والحسابات
        </div>
        <h1
          style={{
            fontSize: "2rem",
            margin: "0 0 10px",
            background:
              "linear-gradient(135deg, var(--gh-navy) 0%, var(--gh-navy-2) 70%, var(--gh-gold-dark) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.8px",
          }}
        >
          لوحة التحكم الرئيسية
        </h1>
        <p style={{ color: "var(--gh-muted)", margin: 0, fontSize: "1rem", lineHeight: 1.7 }}>
          أهلاً بك في نظام شركة الغدير. اختر القسم للانتقال إليه.
        </p>
      </section>

      <div
        className="section-title"
        style={{
          maxWidth: 1100,
          margin: "0 auto 14px",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "var(--gh-navy)",
          fontWeight: 800,
          fontSize: "1.05rem",
        }}
      >
        <span
          style={{
            width: 5,
            height: 22,
            background: "linear-gradient(180deg, var(--gh-gold-light), var(--gh-gold-dark))",
            borderRadius: 4,
          }}
        />
        الوصول السريع
        <small
          style={{
            color: "var(--gh-muted)",
            fontWeight: 500,
            fontSize: "0.82rem",
            marginRight: "auto",
          }}
        >
          اختر القسم للانتقال
        </small>
      </div>

      <div className="dashboard-grid">
        <DashCard icon="📄" title="اعمل وصل" desc="إصدار الوثيقة المؤقتة وطباعتها PDF" to="/wasl" />
        <DashCard icon="👥" title="العملاء" desc="إدارة وإضافة عملاء جدد" to="/customers" />
        <DashCard icon="🧾" title="الوصولات" desc="عرض وتحرير وصولات العملاء" to="/receipts" />
        <DashCard
          icon="📊"
          title="كشف الحساب"
          desc="مراجعة العمليات المالية والرصيد"
          to="/accounts"
        />
        <DashCard icon="💰" title="المصروفات" desc="إضافة وتتبع مصروفات الشركة" to="/expenses" />
        <DashCard icon="📈" title="التقارير" desc="ملخص شامل لجميع العملاء" to="/reports" />
      </div>
    </div>
  );
}

function DashCard({
  icon,
  title,
  desc,
  to,
}: {
  icon: string;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <div className="dashboard-card">
      <div className="card-icon" style={cardIconStyle}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <Link to={to}>فتح ←</Link>
    </div>
  );
}

const cardIconStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 16,
  margin: "0 auto 6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.6rem",
  background: "linear-gradient(135deg, rgba(201,161,74,0.15), rgba(201,161,74,0.05))",
  border: "1px solid rgba(201,161,74,0.25)",
  color: "var(--gh-gold-dark)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
};
