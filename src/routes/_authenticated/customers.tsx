import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  Globe2,
  Info,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Plus,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

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
    <>
      <style>{`
        .customers-dark-example { display: none; }
        html[data-ghadeer-theme="dark"] .customers-legacy-page { display: none !important; }
        html[data-ghadeer-theme="dark"] .customers-dark-example { display: block; }
        html[data-ghadeer-theme="dark"] .customer-add-shell {
          width: min(100%, 900px);
          margin: 0 auto;
          padding: 18px 14px 115px;
          color: #fff;
        }
        html[data-ghadeer-theme="dark"] .customer-add-topbar {
          display: grid;
          grid-template-columns: 46px 1fr 46px;
          align-items: center;
          min-height: 68px;
          margin: -18px -14px 24px;
          padding: 8px 18px;
          border-bottom: 1px solid rgba(34, 142, 255, .26);
          background: linear-gradient(180deg, rgba(3,17,43,.96), rgba(3,17,43,.82));
          backdrop-filter: blur(16px);
        }
        html[data-ghadeer-theme="dark"] .customer-add-topbar h1 {
          margin: 0;
          text-align: center;
          font-size: clamp(1.25rem, 4.8vw, 1.75rem);
          font-weight: 900;
          color: #fff !important;
        }
        html[data-ghadeer-theme="dark"] .customer-back {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 13px;
          color: #f5c75f !important;
          text-decoration: none;
          transition: .2s ease;
        }
        html[data-ghadeer-theme="dark"] .customer-back:hover { background: rgba(245,199,95,.08); }
        html[data-ghadeer-theme="dark"] .customer-hero {
          position: relative;
          display: grid;
          grid-template-columns: 108px 1fr;
          align-items: center;
          gap: 18px;
          overflow: hidden;
          margin-bottom: 30px;
          padding: 26px 28px;
          border: 1px solid rgba(32,147,255,.4);
          border-radius: 22px;
          background:
            radial-gradient(circle at 14% 50%, rgba(0,145,255,.24), transparent 31%),
            linear-gradient(135deg, rgba(6,31,70,.95), rgba(3,20,48,.94));
          box-shadow: inset 0 0 45px rgba(9,122,255,.06), 0 18px 44px rgba(0,0,0,.22);
        }
        html[data-ghadeer-theme="dark"] .customer-hero::after {
          content: "";
          position: absolute;
          inset: 12px 12px auto auto;
          width: 80px;
          height: 80px;
          opacity: .28;
          background-image: radial-gradient(rgba(22,140,255,.75) 1px, transparent 1px);
          background-size: 9px 9px;
          mask-image: linear-gradient(135deg,#000,transparent);
        }
        html[data-ghadeer-theme="dark"] .customer-hero-icon {
          width: 92px;
          height: 92px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #f4c45c;
          border: 1px solid rgba(34,153,255,.5);
          background: radial-gradient(circle at 35% 28%, #123d75, #04152f 68%);
          box-shadow: 0 0 28px rgba(0,140,255,.35);
        }
        html[data-ghadeer-theme="dark"] .customer-hero-copy { min-width: 0; }
        html[data-ghadeer-theme="dark"] .customer-hero-copy h2 {
          margin: 0 0 8px;
          color: #f4c45c !important;
          font-size: clamp(1.2rem,4.5vw,1.7rem);
          font-weight: 900;
        }
        html[data-ghadeer-theme="dark"] .customer-hero-copy p {
          margin: 0;
          color: rgba(255,255,255,.76) !important;
          line-height: 1.9;
          font-size: .98rem;
        }
        html[data-ghadeer-theme="dark"] .customer-section { margin-top: 28px; }
        html[data-ghadeer-theme="dark"] .customer-section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 14px;
          color: #fff !important;
          font-size: 1.15rem;
          font-weight: 900;
        }
        html[data-ghadeer-theme="dark"] .customer-section-title span {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #fff;
          border: 1px solid rgba(0,148,255,.48);
          background: linear-gradient(145deg,#0b3d78,#061f48);
          box-shadow: 0 0 20px rgba(0,133,255,.17);
        }
        html[data-ghadeer-theme="dark"] .customer-grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 14px;
        }
        html[data-ghadeer-theme="dark"] .customer-field.full { grid-column: 1 / -1; }
        html[data-ghadeer-theme="dark"] .customer-field {
          position: relative;
          min-width: 0;
          min-height: 104px;
          padding: 15px 54px 13px 16px;
          border: 1px solid rgba(31,139,240,.42);
          border-radius: 18px;
          background: linear-gradient(145deg,rgba(7,31,68,.94),rgba(4,23,54,.96));
          box-shadow: inset 0 0 28px rgba(13,105,220,.04);
        }
        html[data-ghadeer-theme="dark"] .customer-field-icon {
          position: absolute;
          top: 50%;
          right: 17px;
          transform: translateY(-50%);
          color: rgba(223,232,248,.72);
        }
        html[data-ghadeer-theme="dark"] .customer-field label {
          display: block;
          margin-bottom: 4px;
          color: #fff !important;
          font-size: .91rem;
          font-weight: 800;
        }
        html[data-ghadeer-theme="dark"] .customer-field .required { color: #ff625c !important; }
        html[data-ghadeer-theme="dark"] .customer-field input,
        html[data-ghadeer-theme="dark"] .customer-field select,
        html[data-ghadeer-theme="dark"] .customer-field textarea {
          width: 100%;
          min-height: 40px;
          margin: 0 !important;
          padding: 4px 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          outline: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          color: #fff !important;
          font: inherit;
          font-size: .98rem !important;
        }
        html[data-ghadeer-theme="dark"] .customer-field textarea { min-height: 64px; resize: vertical; }
        html[data-ghadeer-theme="dark"] .customer-field input::placeholder,
        html[data-ghadeer-theme="dark"] .customer-field textarea::placeholder { color: rgba(201,211,230,.48) !important; }
        html[data-ghadeer-theme="dark"] .customer-field select { color: rgba(255,255,255,.72) !important; }
        html[data-ghadeer-theme="dark"] .status-active { color: #2ee78b !important; font-weight: 900; }
        html[data-ghadeer-theme="dark"] .customer-actions {
          display: grid;
          grid-template-columns: minmax(0,1.8fr) minmax(145px,.8fr);
          gap: 14px;
          margin-top: 28px;
        }
        html[data-ghadeer-theme="dark"] .customer-save,
        html[data-ghadeer-theme="dark"] .customer-cancel {
          min-height: 60px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 16px !important;
          font: inherit;
          font-weight: 900;
          font-size: 1.05rem;
          cursor: pointer;
        }
        html[data-ghadeer-theme="dark"] .customer-save {
          color: #07142f !important;
          border: 1px solid #ffe08a !important;
          background: linear-gradient(100deg,#d9a936,#ffe082 48%,#f4c455) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.55), 0 12px 32px rgba(226,174,52,.24) !important;
        }
        html[data-ghadeer-theme="dark"] .customer-cancel {
          color: #fff !important;
          border: 1px solid #178ce9 !important;
          background: rgba(5,28,64,.88) !important;
          text-decoration: none;
        }
        @media (max-width: 640px) {
          html[data-ghadeer-theme="dark"] .customer-add-shell { padding-inline: 12px; }
          html[data-ghadeer-theme="dark"] .customer-add-topbar { margin-inline: -12px; }
          html[data-ghadeer-theme="dark"] .customer-hero { grid-template-columns: 82px 1fr; padding: 22px 18px; }
          html[data-ghadeer-theme="dark"] .customer-hero-icon { width: 74px; height: 74px; }
          html[data-ghadeer-theme="dark"] .customer-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          html[data-ghadeer-theme="dark"] .customer-field { min-height: 96px; padding-right: 48px; }
          html[data-ghadeer-theme="dark"] .customer-field.mobile-full { grid-column: 1 / -1; }
          html[data-ghadeer-theme="dark"] .customer-actions { grid-template-columns: minmax(0,1.6fr) minmax(110px,.8fr); }
        }
        @media (max-width: 390px) {
          html[data-ghadeer-theme="dark"] .customer-hero { grid-template-columns: 1fr; text-align: center; }
          html[data-ghadeer-theme="dark"] .customer-hero-icon { margin: 0 auto; }
          html[data-ghadeer-theme="dark"] .customer-grid { grid-template-columns: 1fr; }
          html[data-ghadeer-theme="dark"] .customer-field { grid-column: 1 / -1; }
          html[data-ghadeer-theme="dark"] .customer-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="customers-dark-example">
        <div className="customer-add-shell">
          <header className="customer-add-topbar">
            <Link to="/" className="customer-back" aria-label="العودة">
              <ArrowRight size={28} />
            </Link>
            <h1>إضافة عميل جديد</h1>
            <span aria-hidden="true" />
          </header>

          <section className="customer-hero">
            <div className="customer-hero-icon" aria-hidden="true">
              <UserPlus size={48} strokeWidth={1.8} />
            </div>
            <div className="customer-hero-copy">
              <h2>عميل جديد.. شراكة أقوى</h2>
              <p>أضف عميلك الآن وابدأ بتنظيم معاملاته بشكل احترافي وسهل.</p>
            </div>
          </section>

          <form onSubmit={(event) => event.preventDefault()}>
            <section className="customer-section">
              <h2 className="customer-section-title">
                <span><User size={22} /></span>
                بيانات العميل
              </h2>
              <div className="customer-grid">
                <div className="customer-field full">
                  <Building2 className="customer-field-icon" size={25} />
                  <label htmlFor="customer-name">اسم العميل / الشركة <b className="required">*</b></label>
                  <input id="customer-name" name="name" placeholder="أدخل اسم العميل أو اسم الشركة" required />
                </div>

                <div className="customer-field full">
                  <Briefcase className="customer-field-icon" size={25} />
                  <label htmlFor="customer-type">نوع العميل <b className="required">*</b></label>
                  <select id="customer-type" name="type" required defaultValue="">
                    <option value="" disabled>اختر نوع العميل</option>
                    <option value="individual">فرد</option>
                    <option value="company">شركة</option>
                    <option value="trader">تاجر</option>
                  </select>
                </div>

                <div className="customer-field">
                  <Phone className="customer-field-icon" size={25} />
                  <label htmlFor="customer-phone">رقم الهاتف <b className="required">*</b></label>
                  <input id="customer-phone" name="phone" type="tel" inputMode="tel" placeholder="07xxxxxxxxx" required />
                </div>

                <div className="customer-field">
                  <Mail className="customer-field-icon" size={25} />
                  <label htmlFor="customer-email">البريد الإلكتروني</label>
                  <input id="customer-email" name="email" type="email" placeholder="example@email.com" />
                </div>

                <div className="customer-field full">
                  <MapPin className="customer-field-icon" size={25} />
                  <label htmlFor="customer-address">العنوان</label>
                  <input id="customer-address" name="address" placeholder="أدخل عنوان العميل" />
                </div>

                <div className="customer-field full">
                  <FileText className="customer-field-icon" size={25} />
                  <label htmlFor="customer-notes">ملاحظات (اختياري)</label>
                  <textarea id="customer-notes" name="notes" placeholder="أي ملاحظات إضافية حول العميل" />
                </div>
              </div>
            </section>

            <section className="customer-section">
              <h2 className="customer-section-title">
                <span><Info size={22} /></span>
                معلومات إضافية
              </h2>
              <div className="customer-grid">
                <div className="customer-field">
                  <MapPinned className="customer-field-icon" size={25} />
                  <label htmlFor="customer-city">المدينة</label>
                  <select id="customer-city" name="city" defaultValue="">
                    <option value="" disabled>اختر المدينة</option>
                    <option value="zakho">زاخو</option>
                    <option value="duhok">دهوك</option>
                    <option value="erbil">أربيل</option>
                    <option value="baghdad">بغداد</option>
                  </select>
                </div>

                <div className="customer-field">
                  <Globe2 className="customer-field-icon" size={25} />
                  <label htmlFor="customer-country">الدولة</label>
                  <select id="customer-country" name="country" defaultValue="">
                    <option value="" disabled>اختر الدولة</option>
                    <option value="iraq">العراق</option>
                    <option value="turkey">تركيا</option>
                  </select>
                </div>

                <div className="customer-field full mobile-full">
                  <ShieldCheck className="customer-field-icon" size={25} />
                  <label htmlFor="customer-status">حالة العميل</label>
                  <select id="customer-status" name="status" defaultValue="active" className="status-active">
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="customer-actions">
              <button type="submit" className="customer-save">
                <Plus size={25} strokeWidth={2.5} />
                حفظ العميل
              </button>
              <Link to="/" className="customer-cancel">إلغاء</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="customers-legacy-page" style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
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
    </>
  );
}
