import { ShieldCheck } from "lucide-react";

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
  driver_name: string;
  vehicle_number: string;
  licence_number?: string | null;
  checkpoint_name_control: string;
  registration_governorate?: string | null;
  cargo_typedetails?: string | null;
  weight_quantity: string;
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

export function DocumentTemplate({ doc }: { doc: DocumentData }) {
  const issued = new Date(doc.created_at);
  const dateStr = issued.toLocaleDateString("ar-IQ");
  const timeStr = issued.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });

  const border = "1px solid #d6d6d6";
  const cellPad = "1.2mm 2mm";
  const rowH = "6.5mm";

  return (
    <div
      className="qr-document-root"
      dir="rtl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "12mm 14mm 10mm 14mm",
        margin: "0 auto",
        background: "white",
        color: "#111",
        fontFamily: "'Cairo', sans-serif",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10pt", marginBottom: "8mm" }}>
        <div style={{ textAlign: "right", lineHeight: 1.7, flex: 1 }}>
          <div>رقم الوثيقة</div>
          <div>تاريخ إنشاء الوثيقة</div>
          <div>التوقيت</div>
        </div>
        <div style={{ width: "22mm", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Logo size="22mm" />
        </div>
        <div style={{ textAlign: "left", lineHeight: 1.7, flex: 1, direction: "ltr", fontFamily: "'Cairo', sans-serif" }}>
          <div style={{ fontWeight: 700 }}>{doc.document_number}</div>
          <div>{dateStr}</div>
          <div>{timeStr}</div>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: "18pt", fontWeight: 700, textAlign: "right", margin: 0, marginBottom: "4mm" }}>
        منصة المنتج المحلي
      </h1>

      {/* Subject row */}
      <div style={{
        height: "8mm", background: "#efefef", fontSize: "11pt", fontWeight: 700,
        display: "flex", alignItems: "center", padding: "0 2mm", border,
      }}>
        الموضوع: {doc.subject || "وثيقة شحن منتج محلي"}
      </div>

      {/* Company section */}
      <SectionHeader>معلومات الشركة</SectionHeader>
      <InfoTable rowH={rowH} cellPad={cellPad} border={border} rows={[
        ["اسم الشركة / المشروع", doc.company_name_project || doc.company_name],
        ["المحافظة", doc.governorate_name || "-"],
        ["العلامة التجارية", doc.brand || "-"],
        ["رقم الإجازة", doc.license_approval_number || "-"],
        ["الجهة المانحة", doc.granting_license_approval || "-"],
        ["تاريخ الإجازة", doc.license_approval_date || "-"],
        ["منطوق الإجازة / الاختصاص", doc.license_text_specialization || "-"],
      ]} />

      {/* Vehicle section */}
      <SectionHeader>السائق والمركبة</SectionHeader>
      <InfoTable rowH={rowH} cellPad={cellPad} border={border} rows={[
        ["اسم السائق", doc.driver_name],
        ["رقم العجلة", doc.vehicle_number],
        ["محافظة التسجيل", doc.registration_governorate || "-"],
        ["سيطرة الدخول", doc.checkpoint_name_control],
        ["الوجهة النهائية", doc.destination_governorate || "-"],
        ["الوزن / الكمية", doc.weight_quantity],
        ["نوع / تفاصيل الحمولة", doc.cargo_typedetails || "-"],
      ]} />

      {/* Items */}
      <SectionHeader>المواد المرخّصة</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "10pt" }}>
        <thead>
          <tr style={{ background: "#efefef" }}>
            <th style={{ border, padding: cellPad, height: rowH, width: "8%" }}>ت</th>
            <th style={{ border, padding: cellPad, height: rowH, textAlign: "right" }}>اسم المادة</th>
            <th style={{ border, padding: cellPad, height: rowH, width: "20%" }}>الوحدة</th>
            <th style={{ border, padding: cellPad, height: rowH, width: "22%" }}>الكمية</th>
          </tr>
        </thead>
        <tbody>
          {(doc.items ?? []).map((it, i) => (
            <tr key={it.id}>
              <td style={{ border, padding: cellPad, height: rowH, textAlign: "center" }}>{i + 1}</td>
              <td style={{ border, padding: cellPad, height: rowH, textAlign: "right" }}>{it.item_name}</td>
              <td style={{ border, padding: cellPad, height: rowH, textAlign: "center" }}>{it.unit}</td>
              <td style={{ border, padding: cellPad, height: rowH, textAlign: "center" }}>{it.production_capacity}</td>
            </tr>
          ))}
          {(!doc.items || doc.items.length === 0) && (
            <tr><td colSpan={4} style={{ border, padding: cellPad, textAlign: "center", color: "#888" }}>لا توجد مواد</td></tr>
          )}
        </tbody>
      </table>

      {/* QR */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "4mm", marginBottom: "4mm" }}>
        {doc.qr_code_data ? (
          <img src={doc.qr_code_data} alt="QR" style={{ width: "34mm", height: "34mm" }} />
        ) : (
          <div style={{ width: "34mm", height: "34mm", border, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "9pt" }}>QR</div>
        )}
      </div>

      {/* Notes */}
      <div style={{ fontSize: "9pt", textAlign: "center", lineHeight: 1.5, padding: "0 4mm" }}>
        {doc.notes || "هذه الوثيقة صادرة إلكترونياً عبر منصة المنتج المحلي. يرجى التحقق من صحتها بمسح رمز QR أعلاه."}
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", left: "14mm", right: "14mm", bottom: "10mm",
        borderTop: "1px solid #999", paddingTop: "2mm",
        textAlign: "center", fontSize: "8.5pt",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1mm" }}>
          <Logo size="9mm" />
        </div>
        <div>الهيئة العامة للكمارك — منصة المنتج المحلي · للتحقق: /verify/{doc.document_number}</div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#a40000", color: "#fff", fontSize: "11pt", fontWeight: 700,
      height: "7mm", display: "flex", alignItems: "center", padding: "0 2mm",
      marginTop: "3mm",
    }}>{children}</div>
  );
}

function InfoTable({
  rows, rowH, cellPad, border,
}: { rows: [string, React.ReactNode][]; rowH: string; cellPad: string; border: string }) {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "10pt" }}>
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i}>
            <td style={{ border, padding: cellPad, height: rowH, width: "35%", textAlign: "right", fontWeight: 600, background: "#fafafa" }}>{label}</td>
            <td style={{ border, padding: cellPad, height: rowH, width: "65%", textAlign: "right" }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Logo({ size }: { size: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#1e3a5f", color: "#f5c843",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <ShieldCheck style={{ width: "60%", height: "60%" }} />
    </div>
  );
}