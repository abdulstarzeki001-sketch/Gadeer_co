import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DocumentTemplate } from "@/components/document-template";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { exportElementToPdf } from "@/lib/export-pdf";
import { useRef, useState as useStateReact } from "react";

export const Route = createFileRoute("/_authenticated/documents/preview")({
  head: () => ({ meta: [{ title: "معاينة الوثيقة" }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const [doc, setDoc] = useState<any>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useStateReact(false);

  const handleExportPdf = async () => {
    if (!docRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(docRef.current, `document-PREVIEW.pdf`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("document-preview");
    if (!raw) return;
    const form = JSON.parse(raw);
    QRCode.toDataURL(`${window.location.origin}/verify/PREVIEW`, { width: 300, margin: 1 }).then((qr) => {
      setDoc({
        document_number: "PREVIEW",
        company_name: form.company_name || "—",
        company_name_project: form.company_name_project,
        subject: form.subject,
        driver_name: form.driver_name || "—",
        vehicle_number: form.vehicle_number || "—",
        licence_number: form.license_approval_number || form.licence_number,
        checkpoint_name_control: form.checkpoint_name_control || "—",
        registration_governorate: form.registration_governorate,
        cargo_typedetails: form.cargo_typedetails,
        weight_quantity: form.weight_quantity || "—",
        destination_governorate: form.destination_governorate,
        governorate_name: form.governorate_name,
        x_coordinate: form.x_coordinate,
        y_coordinate: form.y_coordinate,
        granting_license_approval: form.granting_license_approval,
        license_approval_number: form.license_approval_number,
        license_approval_date: form.license_approval_date,
        license_text_specialization: form.license_text_specialization,
        brand: form.brand,
        notes: form.notes,
        qr_code_data: qr,
        document_value: form.document_value,
        created_at: new Date().toISOString(),
        items: [],
      });
    });
  }, []);

  if (!doc) return <div className="p-8 text-center">جاري تحميل المعاينة...</div>;

  return (
    <div className="bg-muted min-h-screen py-6">
      <div className="max-w-[230mm] mx-auto mb-4 px-4 flex justify-end gap-2 print:hidden">
        <Button onClick={handleExportPdf} disabled={exporting} variant="outline">
          <Download className="h-4 w-4 ml-2" />
          {exporting ? "جاري التنزيل..." : "تنزيل PDF"}
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 ml-2" />
          طباعة / حفظ PDF
        </Button>
      </div>
      <div ref={docRef} className="bg-white shadow-lg mx-auto" style={{ width: "210mm" }}>
        <DocumentTemplate doc={doc} />
      </div>
    </div>
  );
}