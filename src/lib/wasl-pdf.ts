import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { PDF_ASSETS } from "./wasl-assets";

const FONT_STACK = "'Cairo','Segoe UI','Tahoma',Arial,sans-serif";

export type WaslForm = {
  docNumber: string;
  docDate: string;
  docTime: string;
  entryPoint: string;
  driverName: string;
  vehicleNumber: string;
  vehicleProvince: string;
  weight: string;
  destination: string;
  companyName: string;
  provinceName: string;
  trademark: string;
  cargoType: string;
  licenseAuthority: string;
  licenseNumber: string;
  licenseDate: string;
  licenseDescription: string;
  licensedProducts: string;
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(form: WaslForm, qrDataUrl: string): string {
  const A = PDF_ASSETS;
  const rows: [string, string][] = [
    ["اسم سيطرة الدخول", form.entryPoint],
    ["اسم السائق", form.driverName],
    ["رقم العجلة", form.vehicleNumber],
    ["محافظة تسجيل العجلة", form.vehicleProvince],
    ["نوع / تفاصيل الحمولة", form.cargoType],
    ["الوزن / الكمية", form.weight ? form.weight + " طن" : ""],
    ["الوجهة النهائية / المحافظة", form.destination],
    ["اسم المحافظة", form.provinceName],
    ["اسم الشركة / المشروع", form.companyName],
    ["الجهة المانحة للإجازة / الموافقة", form.licenseAuthority],
    ["رقم الإجازة / الموافقة", form.licenseNumber],
    ["تاريخ الإجازة / الموافقة", form.licenseDate],
    ["منطوق الإجازة / الاختصاص", form.licenseDescription],
    ["العلامة التجارية", form.trademark || "—"],
  ];

  const rowsHtml = rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("");

  const productRow = `<tr><td>${
    esc(form.licensedProducts) || "لا توجد مواد مضافة"
  }</td><td>${form.weight ? esc(form.weight) + " طن" : "—"}</td></tr>`;

  const logoImg = A.LOGO_BASE64
    ? `<img src="${A.LOGO_BASE64}" alt="شعار" class="center-logo" />`
    : "";
  const footerLogo = A.EAGLE_BASE64
    ? `<img src="${A.EAGLE_BASE64}" class="bottom-right-logo" alt="شعار العراق" />`
    : "";
  const qrBlock = qrDataUrl
    ? `<img class="barcode-box" src="${qrDataUrl}" alt="QR" />`
    : `<div class="barcode-box"></div>`;

  return (
    `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>` +
    `html,body{margin:0;padding:0;background:#fff;color:#222;font-family:${FONT_STACK};}` +
    `</style></head><body><div class="a4-page" dir="rtl">` +
    `<style>` +
    `@font-face{font-family:'Cairo';font-style:normal;font-weight:400;font-display:block;src:url(${A.CAIRO_REGULAR_B64}) format('truetype');}` +
    `@font-face{font-family:'Cairo';font-style:normal;font-weight:700;font-display:block;src:url(${A.CAIRO_BOLD_B64}) format('truetype');}` +
    `.a4-page *{box-sizing:border-box;margin:0;padding:0;}` +
    `.a4-page{width:210mm;min-height:297mm;padding:11mm 8mm 8mm;position:relative;background:#fff;color:#222;direction:rtl;text-align:right;font-family:${FONT_STACK};font-size:10pt;}` +
    `.a4-page .header-clean{display:grid;grid-template-columns:1fr 40mm 1fr;align-items:start;min-height:31mm;font-size:9pt;font-weight:300;line-height:1.65;}` +
    `.a4-page .header-right,.a4-page .header-left{padding-top:8mm;}` +
    `.a4-page .header-right{padding-top:10mm;font-weight:400;line-height:1.4;text-align:right;}` +
    `.a4-page .header-center{text-align:center;padding-top:3mm;}` +
    `.a4-page .logo-ring{width:20mm;height:20mm;margin:0 auto;display:flex;align-items:center;justify-content:center;border:1px solid #dcdcdc;border-radius:50%;background:#fff;overflow:hidden;}` +
    `.a4-page .center-logo{width:18mm;height:18mm;object-fit:contain;}` +
    `.a4-page .meta-line{display:grid;grid-template-columns:35mm 1fr;gap:2mm;font-size:9.5pt;font-weight:700;}` +
    `.a4-page .meta-label{text-align:right;font-weight:800;}` +
    `.a4-page .meta-value{direction:ltr;text-align:left;}` +
    `.a4-page .divider{margin:0 0 2mm;border:0;border-top:1px solid #d8d8d8;}` +
    `.a4-page .doc-title{margin:0 0 4px;font-size:14pt;font-weight:500;}` +
    `.a4-page .light-box{border-radius:8px;}` +
    `.a4-page .subject-row{min-height:2mm;margin-bottom:1mm;display:flex;align-items:center;gap:3mm;font-size:10.5pt;font-weight:900;}` +
    `.a4-page .subject-box{background:transparent;padding:0;border-radius:0;font-weight:700;}` +
    `.a4-page .info-table{width:100%;border-collapse:collapse;table-layout:fixed;line-height:1.25;background:#fff;}` +
    `.a4-page .info-table .col-right{width:35%;}` +
    `.a4-page .info-table .col-left{width:65%;}` +
    `.a4-page .info-table th,.a4-page .info-table td{height:5mm;padding:0.2mm 1.5mm 1.2mm;border:1px solid #d6d6d6;text-align:right;vertical-align:middle;font-size:9pt;font-weight:400;line-height:1.3;word-break:break-word;}` +
    `.a4-page .info-table th{height:1mm;background:#a40000;color:#fff;text-align:center;font-weight:700;}` +
    `.a4-page .info-table td{color:#222;font-weight:600;}` +
    `.a4-page .qr-wrap{display:flex;justify-content:center;margin:4mm 0;}` +
    `.a4-page .barcode-box{width:39mm;height:39mm;background:#fff;border:1px solid #F2F2F2;object-fit:contain;}` +
    `.a4-page .notes{text-align:center;font-size:6pt;line-height:1.5;}` +
    `.a4-page .notes p{margin:0;}` +
    `.a4-page .notes .light-note{color:#777;}` +
    `.a4-page .notes b{color:#1d66d1;font-weight:700;}` +
    `.a4-page .doc-footer{position:absolute;right:13mm;bottom:7mm;left:13mm;padding-top:2mm;display:grid;grid-template-columns:1fr 1.5fr 1fr;align-items:end;border-top:1px solid #d9d9d9;font-size:6.5pt;font-weight:700;line-height:1.35;}` +
    `.a4-page .bottom-right-logo{position:absolute;right:0;bottom:-4mm;width:8mm;height:auto;object-fit:contain;}` +
    `.a4-page .footer-center{text-align:center;}` +
    `.a4-page .footer-right{direction:ltr;text-align:left;font-size:6pt;font-weight:600;}` +
    `</style>` +
    `<header class="header-clean">` +
    `<div class="header-right"><div>جمهورية العراق</div><div>وزارة المالية</div><div>الهيـئة العـامـة للكمـــارك</div></div>` +
    `<div class="header-center"><div class="logo-ring">${logoImg}</div></div>` +
    `<div class="header-left">` +
    `<div class="meta-line"><span class="meta-label">رقم الوثيقة</span><span class="meta-value">${esc(form.docNumber)}</span></div>` +
    `<div class="meta-line"><span class="meta-label">تاريخ إنشاء الوثيقة</span><span class="meta-value">${esc(form.docDate)}</span></div>` +
    `<div class="meta-line"><span class="meta-label">التوقيت</span><span class="meta-value">${esc(form.docTime)}</span></div>` +
    `</div>` +
    `</header>` +
    `<hr class="divider" />` +
    `<div class="content">` +
    `<h2 class="doc-title">منصة المنتج المحلي</h2>` +
    `<div class="light-box">` +
    `<div class="subject-row"><strong>الموضوع /</strong><span class="subject-box">الوثيقة المؤقتة لبيانات الحمولة من قبل الشركة</span></div>` +
    `<table class="info-table"><colgroup><col class="col-right" /><col class="col-left" /></colgroup><tbody>` +
    `<tr><th colspan="2">المعلومات الشخصية</th></tr>${rowsHtml}` +
    `<tr><th colspan="2">المواد / المنتجات المرخّصة</th></tr>${productRow}` +
    `</tbody></table>` +
    `</div>` +
    `<div class="qr-wrap">${qrBlock}</div>` +
    `<div class="notes">` +
    `<p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p>` +
    `<p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p>` +
    `<p class="light-note">لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:</p>` +
    `<b>https://ur.gov.iq</b>` +
    `</div>` +
    `</div>` +
    `<footer class="doc-footer">${footerLogo}` +
    `<div></div>` +
    `<div class="footer-center"><div>مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</div><div>بغداد – كرادة مريم</div><div>المركز الوطني للتحول الرقمي @2025</div></div>` +
    `<div class="footer-right"><div>Prime Minister's Office</div><div>National Center for Digital Transformation</div><div>Tel: 5599</div></div>` +
    `</footer>` +
    `</div></body></html>`
  );
}

export async function generateDocumentPdf(form: WaslForm, qrDataUrl: string): Promise<Blob> {
  const html = buildHtml(form, qrDataUrl);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "230mm";
  iframe.style.height = "320mm";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    const win = iframe.contentWindow!;
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      try {
        await Promise.all([fonts.load("400 16px Cairo"), fonts.load("700 16px Cairo")]);
      } catch {
        /* fall back */
      }
      if (fonts.ready) await fonts.ready;
    }
    await new Promise((r) => setTimeout(r, 120));

    const target = doc.querySelector(".a4-page") as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, Math.min(imgH, pageH));
    void win;
    return pdf.output("blob");
  } finally {
    document.body.removeChild(iframe);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("فشل قراءة ملف QR"));
    r.readAsDataURL(file);
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
