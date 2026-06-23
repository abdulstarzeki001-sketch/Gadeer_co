import logoAsset from "@/assets/logo_new.png.asset.json";
import emblemAsset from "@/assets/iraq-emblem.png.asset.json";

interface DocumentItem {
  id: string;
  item_name: string;
  unit: string;
  production_capacity: string | null;
}

interface DocumentData {
  document_number: string;
  company_name: string;
  company_name_project?: string | null;
  subject?: string | null;
  driver_name?: string | null;
  vehicle_number?: string | null;
  licence_number?: string | null;
  checkpoint_name_control?: string | null;
  registration_governorate?: string | null;
  cargo_typedetails?: string | null;
  weight_quantity?: string | null;
  destination_governorate?: string | null;
  governorate_name?: string | null;
  x_coordinate?: string | null;
  y_coordinate?: string | null;
  granting_license_approval?: string | null;
  license_approval_number?: string | null;
  license_approval_date?: string | null;
  license_text_specialization?: string | null;
  brand?: string | null;
  notes?: string | null;
  qr_code_data?: string | null;
  document_value?: number | string | null;
  created_at: string;
  items?: DocumentItem[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  let hour = d.getHours();
  const minute = String(d.getMinutes()).padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export function DocumentTemplate({ doc }: { doc: DocumentData }) {
  const rows: [string, React.ReactNode][] = [
    ["اسم سيطرة الدخول", doc.checkpoint_name_control || "-"],
    ["اسم السائق", doc.driver_name || "-"],
    ["رقم العجلة", doc.vehicle_number || "-"],
    ["محافظة تسجيل العجلة", doc.registration_governorate || "-"],
    ["نوع / تفاصيل الحمولة", doc.cargo_typedetails || "-"],
    ["الوزن / الكمية", doc.weight_quantity || "-"],
    ["الوجهة النهائية / المحافظة", doc.destination_governorate || "-"],
    ["اسم المحافظة", doc.governorate_name || "-"],
    ["اسم الشركة / المشروع", doc.company_name_project || doc.company_name],
    ["الجهة المانحة للإجازة / الموافقة", doc.granting_license_approval || "-"],
    ["رقم الإجازة / الموافقة", doc.license_approval_number || "-"],
    ["تاريخ الإجازة / الموافقة", doc.license_approval_date || "-"],
    ["منطوق الإجازة / الاختصاص", doc.license_text_specialization || "-"],
    ["العلامة التجارية", doc.brand || "-"],
  ];

  const items = doc.items ?? [];

  return (
    <div className="qr-document-root a4-page">
      {/* Header */}
      <header className="header-clean">
        <div className="header-right">
          <div>جمهورية العراق</div>
          <div>وزارة المالية</div>
          <div>الهيئة العامة للكمارك</div>
        </div>
        <div className="header-center">
          <div className="logo-ring">
            <img src={logoAsset.url} alt="Iraq Customs" className="center-logo" />
          </div>
        </div>
        <div className="header-left">
          <MetaLine label="رقم الوثيقة" value={doc.document_number} />
          <MetaLine label="تاريخ إنشاء الوثيقة" value={formatDate(doc.created_at)} />
          <MetaLine label="التوقيت" value={formatTime(doc.created_at)} />
        </div>
      </header>

      <hr className="divider" />

      <div className="content">
        <h2 className="doc-title">منصة المنتج المحلي</h2>

        <div className="subject-row">
          <strong>الموضوع /</strong>
          <span className="subject-field">الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة</span>
        </div>

        <table className="info-table">
          <colgroup>
            <col style={{ width: "100%" }} />
          </colgroup>
          <thead>
            <tr><th colSpan={2}>المعلومات الشخصية</th></tr>
          </thead>
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={i}>
                <td>{label}</td>
                <td>{value}</td>
              </tr>
            ))}
            <tr><th colSpan={2}>المواد / المنتجات المرخّصة</th></tr>
            {items.length === 0 ? (
              <tr>
                <td colSpan={2}>{doc.weight_quantity || "-"}</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td colSpan={2}>{doc.weight_quantity || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {doc.qr_code_data ? (
          <div className="qr-wrap">
            <img src={doc.qr_code_data} alt="صورة الوثيقة" className="barcode-img" />
          </div>
        ) : null}

        <div className="notes">
          <p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p>
          <p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p>
          <p className="notes-muted">لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:</p>
          <b>https://ur.gov.iq</b>
        </div>
      </div>

      <footer className="doc-footer">
        <div className="footer-left">
          <img src={emblemAsset.url} alt="شعار جمهورية العراق" className="iraq-emblem" />
        </div>
        <div className="footer-center">
          <div>مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</div>
          <div>بغداد – كرادة مريم</div>
          <div>المركز الوطني للتحول الرقمي @2025</div>
        </div>
        <div className="footer-right">
          <div>Prime Minister's Office</div>
          <div>National Center for Digital Transformation</div>
          <div>Tel: 5599</div>
        </div>
      </footer>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="meta-line">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}
