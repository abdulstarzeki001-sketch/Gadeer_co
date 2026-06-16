import logoAsset from "@/assets/iraq-customs-logo.png.asset.json";

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
  return `${y}/${m}/${day}`;
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
  const border = "1px solid #d6d6d6";
  const labelCell: React.CSSProperties = {
    border, height: "6.5mm", padding: "1mm 2mm", width: "35%",
    fontWeight: 700, color: "#555", textAlign: "right", verticalAlign: "middle",
  };
  const valueCell: React.CSSProperties = {
    border, height: "6.5mm", padding: "1mm 2mm", width: "65%",
    textAlign: "center", fontWeight: 600, color: "#222", verticalAlign: "middle",
  };
  const headerTh: React.CSSProperties = {
    background: "#a40000", color: "#fff", height: "7mm",
    fontSize: "11pt", fontWeight: 800, textAlign: "center",
    border, padding: "1mm 2mm",
  };

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
    <div
      className="qr-document-root"
      dir="rtl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "12mm 14mm 10mm 14mm",
        margin: "0 auto",
        background: "#fff",
        color: "#222",
        fontFamily: "'Cairo', Arial, sans-serif",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Header */}
      <header style={{
        display: "grid",
        gridTemplateColumns: "1fr 32mm 1fr",
        alignItems: "start",
        minHeight: "38mm",
        fontSize: "10pt",
        fontWeight: 700,
        lineHeight: 1.65,
      }}>
        <div style={{ textAlign: "right", paddingTop: "6mm" }}>
          <div>جمهورية العراق</div>
          <div>وزارة المالية</div>
          <div>الهيئة العامة للكمارك</div>
        </div>
        <div style={{ textAlign: "center", paddingTop: "1mm" }}>
          <div style={{
            width: "26mm", height: "26mm", borderRadius: "50%",
            border: "2px solid #d8d8d8", margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff", overflow: "hidden",
          }}>
            <img src={logoAsset.url} alt="Iraq Customs" style={{ width: "23mm", height: "23mm", objectFit: "contain" }} />
          </div>
        </div>
        <div style={{ textAlign: "right", paddingTop: "6mm" }}>
          <MetaLine label="رقم الوثيقة" value={doc.document_number} />
          <MetaLine label="تاريخ إنشاء الوثيقة" value={formatDate(doc.created_at)} />
          <MetaLine label="التوقيت" value={formatTime(doc.created_at)} />
        </div>
      </header>

      <hr style={{ border: "none", borderTop: "1px solid #d8d8d8", margin: "0 0 6mm 0" }} />

      {/* Title */}
      <h2 style={{ textAlign: "center", fontSize: "18pt", fontWeight: 800, lineHeight: 1.2, margin: "0 0 4mm 0" }}>
        منصة المنتج المحلي
      </h2>

      {/* Subject */}
      <div style={{
        height: "8mm", background: "#f3f3f3", border: "1px solid #d6d6d6",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "8px", fontSize: "11pt", fontWeight: 700, marginBottom: "2mm",
        boxSizing: "border-box",
      }}>
        <strong>الموضوع /</strong>
        <span>{doc.subject || "الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة"}</span>
      </div>

      {/* Info table */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "10pt", lineHeight: 1.25 }}>
        <thead>
          <tr><th colSpan={2} style={headerTh}>المعلومات الشخصية</th></tr>
        </thead>
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i}>
              <td style={labelCell}>{label}</td>
              <td style={valueCell}>{value}</td>
            </tr>
          ))}
          <tr><th colSpan={2} style={headerTh}>المواد / المنتجات المرخّصة</th></tr>
          {items.length === 0 ? (
            <tr>
              <td style={labelCell}>-</td>
              <td style={valueCell}>-</td>
            </tr>
          ) : (
            items.map((it) => (
              <tr key={it.id}>
                <td style={labelCell}>{it.item_name}</td>
                <td style={valueCell}>{it.production_capacity} {it.unit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* QR */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "4mm", marginBottom: "4mm" }}>
        {doc.qr_code_data ? (
          <img src={doc.qr_code_data} alt="QR" style={{ width: "34mm", height: "34mm", objectFit: "contain" }} />
        ) : (
          <div style={{ width: "34mm", height: "34mm", border, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "9pt" }}>QR</div>
        )}
      </div>

      {/* Notes */}
      <div style={{ textAlign: "center", fontSize: "9pt", lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p>
        <p style={{ margin: 0 }}>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p>
        <p style={{ margin: 0 }}>لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:</p>
        <b style={{ color: "#1d66d1" }}>https://ur.gov.iq</b>
      </div>

      {/* Footer */}
      <footer style={{
        position: "absolute", bottom: "7mm", left: "14mm", right: "14mm",
        borderTop: "1px solid #d9d9d9", paddingTop: "2mm",
        display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr",
        alignItems: "end", fontSize: "8.5pt", lineHeight: 1.35,
      }}>
        <div />
        <div style={{ textAlign: "center", fontWeight: 700 }}>
          <div>مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</div>
          <div>بغداد – كرادة مريم</div>
          <div>المركز الوطني للتحول الرقمي @2025</div>
        </div>
        <div style={{ textAlign: "left", direction: "ltr" }}>
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
    <div style={{ display: "grid", gridTemplateColumns: "35mm 1fr", gap: "2mm" }}>
      <span style={{ fontWeight: 800 }}>{label}</span>
      <span style={{ direction: "ltr", textAlign: "left", fontWeight: 700 }}>{value}</span>
    </div>
  );
}
