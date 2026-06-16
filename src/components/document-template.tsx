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

  return (
    <div className="doc-page bg-white text-black mx-auto shadow-lg print:shadow-none" dir="rtl"
      style={{ width: "210mm", minHeight: "297mm", padding: "12mm", fontFamily: "Cairo, sans-serif" }}>
      {/* Header */}
      <div className="border-b-4 border-double pb-3" style={{ borderColor: "#1e3a5f" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <div className="text-[11px]">جمهورية العراق</div>
            <div className="text-lg font-bold" style={{ color: "#1e3a5f" }}>الهيئة العامة للكمارك</div>
            <div className="text-[11px]">منصة المنتج المحلي</div>
          </div>
          <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "#1e3a5f" }}>
            <ShieldCheck className="h-9 w-9 text-amber-400" />
          </div>
          <div className="text-center flex-1 text-[11px]">
            <div>Republic of Iraq</div>
            <div className="font-bold">General Authority of Customs</div>
            <div>Local Product Platform</div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-4">
        <h1 className="text-xl font-bold inline-block px-6 py-1 rounded" style={{ background: "#fef3c7", color: "#1e3a5f", border: "1px solid #d4a017" }}>
          وثيقة شحن منتج محلي
        </h1>
      </div>

      {/* Doc meta row */}
      <table className="w-full text-sm mb-4" style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <Cell label="رقم الوثيقة" value={<span className="font-mono font-bold">{doc.document_number}</span>} />
            <Cell label="تاريخ الإصدار" value={issued.toLocaleDateString("ar-IQ")} />
            <Cell label="الموضوع" value={doc.subject || "-"} />
          </tr>
        </tbody>
      </table>

      {/* Company */}
      <Section title="معلومات الشركة">
        <Row label="اسم الشركة / المشروع" value={doc.company_name_project || doc.company_name} colSpan={2} />
        <Row label="المحافظة" value={doc.governorate_name || "-"} />
        <Row label="العلامة التجارية" value={doc.brand || "-"} colSpan={2} />
        <Row label="رقم الإجازة" value={doc.license_approval_number || "-"} />
        <Row label="الجهة المانحة" value={doc.granting_license_approval || "-"} />
        <Row label="تاريخ الإجازة" value={doc.license_approval_date || "-"} />
        <Row label="منطوق الإجازة / الاختصاص" value={doc.license_text_specialization || "-"} colSpan={3} />
      </Section>

      {/* Vehicle */}
      <Section title="السائق والمركبة">
        <Row label="اسم السائق" value={doc.driver_name} />
        <Row label="رقم العجلة" value={doc.vehicle_number} />
        <Row label="محافظة التسجيل" value={doc.registration_governorate || "-"} />
        <Row label="سيطرة الدخول" value={doc.checkpoint_name_control} />
        <Row label="الوجهة النهائية" value={doc.destination_governorate || "-"} />
        <Row label="الوزن / الكمية" value={doc.weight_quantity} />
        <Row label="نوع / تفاصيل الحمولة" value={doc.cargo_typedetails || "-"} colSpan={3} />
      </Section>

      {/* Items table */}
      <div className="mt-4">
        <h3 className="text-sm font-bold mb-1 px-2 py-1" style={{ background: "#1e3a5f", color: "white" }}>المواد المرخّصة</h3>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              <th className="border p-1.5 w-10">ت</th>
              <th className="border p-1.5">اسم المادة</th>
              <th className="border p-1.5 w-20">الوحدة</th>
              <th className="border p-1.5 w-28">الكمية</th>
            </tr>
          </thead>
          <tbody>
            {(doc.items ?? []).map((it, i) => (
              <tr key={it.id}>
                <td className="border p-1.5 text-center">{i + 1}</td>
                <td className="border p-1.5">{it.item_name}</td>
                <td className="border p-1.5 text-center">{it.unit}</td>
                <td className="border p-1.5 text-center font-mono" dir="ltr">{it.production_capacity}</td>
              </tr>
            ))}
            {(!doc.items || doc.items.length === 0) && (
              <tr><td colSpan={4} className="border p-3 text-center text-gray-500">لا توجد مواد</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Coordinates */}
      {(doc.x_coordinate || doc.y_coordinate) && (
        <div className="mt-3 text-sm">
          <span className="font-bold">الإحداثيات:</span>{" "}
          <span dir="ltr" className="font-mono">X: {doc.x_coordinate || "-"} | Y: {doc.y_coordinate || "-"}</span>
        </div>
      )}

      {/* Notes + QR */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="col-span-2">
          <div className="text-sm font-bold mb-1">ملاحظات</div>
          <div className="border p-2 min-h-[80px] text-sm">{doc.notes || "—"}</div>
        </div>
        <div className="border p-2 text-center">
          {doc.qr_code_data ? (
            <img src={doc.qr_code_data} alt="QR" className="mx-auto" style={{ width: 120, height: 120 }} />
          ) : (
            <div className="h-[120px] flex items-center justify-center text-gray-400 text-xs">QR</div>
          )}
          <div className="text-[10px] mt-1 text-gray-600">امسح للتحقق</div>
        </div>
      </div>

      {/* Signature */}
      <div className="grid grid-cols-3 gap-6 mt-10 text-sm text-center">
        <div><div className="border-t border-gray-800 pt-1">مسؤول الإصدار</div></div>
        <div><div className="border-t border-gray-800 pt-1">مدير الشركة</div></div>
        <div><div className="border-t border-gray-800 pt-1">مدير السيطرة</div></div>
      </div>

      <div className="text-[10px] text-center text-gray-500 mt-6 border-t pt-2">
        هذه الوثيقة صادرة إلكترونياً من منصة المنتج المحلي - الهيئة العامة للكمارك. للتحقق امسح رمز QR أو زر /verify
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-bold mb-1 px-2 py-1" style={{ background: "#1e3a5f", color: "white" }}>{title}</h3>
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}><tbody>{children}</tbody></table>
    </div>
  );
}

function Row({ label, value, colSpan = 1 }: { label: string; value: React.ReactNode; colSpan?: number }) {
  return (
    <tr>
      <td className="border p-1.5 font-bold bg-gray-50 w-[180px]">{label}</td>
      <td className="border p-1.5" colSpan={colSpan === 1 ? undefined : colSpan * 2 - 1}>{value}</td>
    </tr>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <td className="border p-1.5 font-bold bg-gray-50">{label}</td>
      <td className="border p-1.5">{value}</td>
    </>
  );
}