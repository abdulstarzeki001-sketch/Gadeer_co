import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, FilePenLine, History, ReceiptText, WalletCards } from "lucide-react";

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
    <>
      <style>{`
        .receipts-page {
          --surface: #fff;
          --surface2: #f8fafc;
          --text: #17233f;
          --muted: #667085;
          --line: #d9dfeb;
          --accent: #c9a14a;
          --accent2: #e7c56d;
          --blue: #2563eb;
          --shadow: 0 16px 38px rgba(15, 23, 42, .1);
          width: min(100%, 1000px);
          margin: 0 auto;
          padding: 24px 14px 110px;
          color: var(--text) !important;
        }

        html[data-ghadeer-theme="dark"] .receipts-page {
          --surface: #052044;
          --surface2: #062653;
          --text: #fff;
          --muted: #9eabc2;
          --line: rgba(20,126,231,.46);
          --accent: #f4c75d;
          --accent2: #ffda76;
          --blue: #118cff;
          --shadow: 0 20px 52px rgba(0,0,0,.28);
        }

        .receipts-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 24px;
          border: 1px solid var(--line);
          border-radius: 24px;
          background: var(--surface) !important;
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }

        html[data-ghadeer-theme="dark"] .receipts-hero {
          background:
            radial-gradient(circle at 12% 18%, rgba(17,140,255,.2), transparent 30%),
            linear-gradient(145deg,#05204a,#03162f) !important;
        }

        .receipts-hero h1 {
          margin: 0 0 7px;
          color: var(--text) !important;
          font-size: clamp(1.6rem, 5vw, 2.25rem);
        }

        .receipts-hero p {
          margin: 0;
          color: var(--muted) !important;
          line-height: 1.85;
        }

        .receipts-hero-icon {
          flex: 0 0 auto;
          width: 70px;
          height: 70px;
          display: grid;
          place-items: center;
          border-radius: 21px;
          color: var(--accent);
          background: var(--surface2) !important;
          border: 1px solid var(--line);
          box-shadow: inset 0 0 28px rgba(17,140,255,.06);
        }

        .receipts-grid {
          display: grid;
          gap: 16px;
          margin-top: 18px;
        }

        .receipt-panel {
          display: grid;
          grid-template-columns: 56px minmax(0,1fr);
          gap: 16px;
          align-items: start;
          padding: 20px;
          border: 1px solid var(--line);
          border-radius: 20px;
          background: var(--surface) !important;
          box-shadow: var(--shadow);
        }

        html[data-ghadeer-theme="dark"] .receipt-panel {
          background: linear-gradient(145deg,rgba(6,31,66,.96),rgba(3,22,50,.97)) !important;
        }

        .receipt-panel-icon {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          color: var(--accent);
          background: var(--surface2) !important;
          border: 1px solid var(--line);
        }

        html[data-ghadeer-theme="dark"] .receipt-panel-icon {
          background: linear-gradient(145deg,#07336e,#041b3e) !important;
        }

        .receipt-panel h2 {
          margin: 0 0 8px;
          color: var(--text) !important;
          font-size: 1.08rem;
        }

        .receipt-panel p {
          margin: 0;
          color: var(--muted) !important;
          line-height: 1.8;
        }

        .receipt-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .receipt-action {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 13px;
          font-weight: 900;
          text-decoration: none;
          transition: transform .18s ease, border-color .18s ease;
        }

        .receipt-action:hover { transform: translateY(-1px); }

        .receipt-action.primary {
          color: #07142f !important;
          border: 1px solid rgba(255,226,139,.72);
          background: linear-gradient(135deg,#c99b35,var(--accent),var(--accent2)) !important;
          box-shadow: 0 12px 28px rgba(240,191,72,.2);
        }

        .receipt-action.secondary {
          color: var(--text) !important;
          border: 1px solid var(--line);
          background: var(--surface2) !important;
        }

        html[data-ghadeer-theme="dark"] .receipt-action.secondary {
          background: #062653 !important;
          color: #fff !important;
        }

        .receipts-footer-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .receipts-footer-actions a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid var(--line);
          border-radius: 13px;
          background: var(--surface2) !important;
          color: var(--text) !important;
          text-decoration: none;
          font-weight: 800;
        }

        html[data-ghadeer-theme="dark"] .receipts-page :is(h1,h2,h3,p,span,small,strong,a) {
          color: #fff !important;
        }

        html[data-ghadeer-theme="dark"] .receipts-page .receipt-action.primary {
          color: #07142f !important;
        }

        @media (max-width: 620px) {
          .receipts-page { padding-inline: 12px; }
          .receipts-hero { padding: 20px 18px; }
          .receipts-hero-icon { width: 60px; height: 60px; }
          .receipt-panel { grid-template-columns: 48px minmax(0,1fr); padding: 17px; }
          .receipt-panel-icon { width: 48px; height: 48px; border-radius: 15px; }
          .receipt-actions { display: grid; grid-template-columns: 1fr; }
          .receipt-action { width: 100%; }
        }
      `}</style>

      <div className="receipts-page">
        <section className="receipts-hero">
          <div>
            <h1>الوصولات</h1>
            <p>إدارة الوصولات وقبوض العملاء ومتابعة العمليات المالية من مكان واحد.</p>
          </div>
          <div className="receipts-hero-icon" aria-hidden="true">
            <ReceiptText size={34} strokeWidth={1.9} />
          </div>
        </section>

        <div className="receipts-grid">
          <section className="receipt-panel">
            <div className="receipt-panel-icon"><Banknote size={25} /></div>
            <div>
              <h2>قبوض العملاء</h2>
              <p>سجّل أي مبلغ تستلمه من العميل ليتم تنزيله مباشرة من رصيده، أو راجع سجل جميع القبوض السابقة.</p>
              <div className="receipt-actions">
                <Link to="/collections" className="receipt-action primary">
                  <Banknote size={18} /> قبض مبلغ من عميل
                </Link>
                <Link to="/collections-history" className="receipt-action secondary">
                  <History size={18} /> سجل القبوض
                </Link>
              </div>
            </div>
          </section>

          <section className="receipt-panel">
            <div className="receipt-panel-icon"><WalletCards size={25} /></div>
            <div>
              <h2>الوصولات الحالية</h2>
              <p>استعرض الوصلات المرتبطة بحسابك مع حالة كل وصول وبيان المشاركة المالية الخاصة بها.</p>
            </div>
          </section>

          <section className="receipt-panel">
            <div className="receipt-panel-icon"><FilePenLine size={25} /></div>
            <div>
              <h2>تحرير الوصلات</h2>
              <p>يمكنك في هذه الصفحة تعديل بيانات الوصلات المستقبلية بعد ربطها بحساب المستخدم.</p>
            </div>
          </section>
        </div>

        <div className="receipts-footer-actions">
          <Link to="/">العودة إلى لوحة التحكم</Link>
          <Link to="/reports"><WalletCards size={17} /> تقارير العملاء</Link>
        </div>
      </div>
    </>
  );
}
