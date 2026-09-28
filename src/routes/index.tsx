import { useEffect, useState } from "react";
import { RoyalDashboard } from "@/components/royal-dashboard";
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
  const [royal, setRoyal] = useState(false);
  useEffect(() => {
    const update = () => setRoyal(document.documentElement.dataset.ghadeerTheme === "midnight");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ghadeer-theme"] });
    return () => observer.disconnect();
  }, []);
  if (royal) return <RoyalDashboard />;
  return (
    <div className="home-page" style={{ padding: "1.4rem 0 3rem" }}>
      <style>{`
        .home-dashboard-title{color:#fff!important}
        .home-dashboard-subtitle{color:rgba(255,255,255,.78)!important}
        .home-stat-pill{transition:transform .2s ease,background .2s ease}
        .home-stat-pill:hover{transform:translateY(-2px);background:rgba(255,255,255,.14)!important}
      `}</style>
      <section
        className="hero"
        style={{ textAlign: "center", margin: "18px auto 20px", maxWidth: 920, padding: "10px 16px 0" }}
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
            padding: "8px 16px",
            borderRadius: 999,
            fontSize: "0.8rem",
            fontWeight: 800,
            letterSpacing: "0.5px",
            marginBottom: 18,
            boxShadow: "0 8px 22px -14px rgba(201,161,74,0.6)",
          }}
        >
          <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px rgba(34,197,94,0.9)" }} />
          منصة إدارة العمليات والحسابات
        </div>

        <h1
          className="home-dashboard-title"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            margin: "0 0 12px",
            letterSpacing: "-0.8px",
            lineHeight: 1.15,
            fontWeight: 900,
            textShadow: "0 8px 30px rgba(10,26,58,0.35)",
          }}
        >
          لوحة التحكم الرئيسية
        </h1>

        <p className="home-dashboard-subtitle" style={{ margin: "0 auto", maxWidth: 620, fontSize: "1rem", lineHeight: 1.8 }}>
          أهلاً بك في نظام شركة الغدير. اختر القسم المناسب لإدارة العملاء، الوصولات، الحسابات، والتقارير بطريقة احترافية وسريعة.
        </p>

        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          <StatPill label="إدارة العملاء" value="متاحة" />
          <StatPill label="الوصولات" value="منظمة" />
          <StatPill label="التقارير" value="PDF" />
        </div>
      </section>

      <div
        className="section-title"
        style={{ maxWidth: 1100, margin: "0 auto 16px", padding: "0 16px", display: "flex", alignItems: "center", gap: 12, color: "#fff", fontWeight: 800, fontSize: "1.08rem", textShadow: "0 10px 30px rgba(10,26,58,0.2)" }}
      >
        <span style={{ width: 6, height: 24, background: "linear-gradient(180deg, var(--gh-gold-light), var(--gh-gold-dark))", borderRadius: 4, boxShadow: "0 0 15px rgba(201,161,74,0.5)" }} />
        الوصول السريع
        <small style={{ color: "rgba(255,255,255,0.72)", fontWeight: 500, fontSize: "0.82rem", marginRight: "auto" }}>اختر القسم للانتقال</small>
      </div>

      <div className="dashboard-grid">
        <DashCard icon="📄" title="اعمل وصل" desc="إصدار الوثيقة المؤقتة وطباعتها PDF" to="/wasl" />
        <DashCard icon="👥" title="العملاء" desc="إدارة وإضافة عملاء جدد" to="/customers" />
        <DashCard icon="🧾" title="الوصولات" desc="عرض وتحرير وصولات العملاء" to="/receipts" />
        <DashCard icon="📊" title="كشف الحساب" desc="مراجعة العمليات المالية والرصيد" to="/accounts" />
        <DashCard icon="💰" title="المصروفات" desc="إضافة وتتبع مصروفات الشركة" to="/expenses" />
        <DashCard icon="📈" title="التقارير" desc="ملخص شامل لجميع العملاء" to="/reports" />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="home-stat-pill" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.82rem", backdropFilter: "blur(8px)" }}>
      <span style={{ color: "rgba(255,255,255,0.72)" }}>{label}</span>
      <strong style={{ color: "#fff" }}>{value}</strong>
    </div>
  );
}

function DashCard({ icon, title, desc, to }: { icon: string; title: string; desc: string; to: string }) {
  return (
    <div className="dashboard-card">
      <div className="card-icon" style={cardIconStyle}>{icon}</div>
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
  margin: "0 auto 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.6rem",
  background: "linear-gradient(135deg, rgba(201,161,74,0.15), rgba(201,161,74,0.05))",
  border: "1px solid rgba(201,161,74,0.25)",
  color: "var(--gh-gold-dark)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 12px 20px -14px rgba(201,161,74,0.7)",
};
