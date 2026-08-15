import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { PDF_ASSETS } from "./wasl-assets";

export type LoadReceiptPdfData = {
  receiptNumber: string;
  loadType: "عراقية" | "تركية";
  customerName: string;
  driverName: string;
  cargoType: string;
  amount: number;
  unitAmount?: number;
  loadCount?: number;
  vehicleNumber?: string;
  destination?: string;
  companyName?: string;
  weight?: string;
  entryPoint?: string;
  vehicleProvince?: string;
  date?: string;
};

const FONT_STACK = "'Cairo','Segoe UI','Tahoma',Arial,sans-serif";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function buildReceiptHtml(data: LoadReceiptPdfData): string {
  const detailRows = [
    ["اسم العميل", data.customerName],
    ...(data.companyName ? [["الشركة / المشروع", data.companyName]] : []),
    ["اسم السائق", data.driverName],
    ...(data.vehicleNumber ? [["رقم العجلة", data.vehicleNumber]] : []),
    ...(data.vehicleProvince ? [["محافظة تسجيل العجلة", data.vehicleProvince]] : []),
    ["نوع / تفاصيل الحمولة", data.cargoType],
    ...(data.weight ? [["الوزن / الكمية", `${data.weight} طن`]] : []),
    ...(data.entryPoint ? [["نقطة السيطرة", data.entryPoint]] : []),
    ...(data.destination ? [["الوجهة النهائية", data.destination]] : []),
    ...(data.unitAmount != null ? [["مبلغ الحمولة الواحدة", money(data.unitAmount)]] : []),
    ...(data.loadCount != null ? [["عدد الحمولات", String(data.loadCount)]] : []),
  ];

  const rowsHtml = detailRows
    .map(([label, value]) => `<tr><td class="label">${esc(label)}</td><td class="value">${esc(value)}</td></tr>`)
    .join("");
  const logo = PDF_ASSETS.LOGO_BASE64
    ? `<div class="logo-wrap"><img src="${PDF_ASSETS.LOGO_BASE64}" alt="شركة الغدير" /></div>`
    : `<div class="logo-mark">غ</div>`;

  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
    @font-face{font-family:'Cairo';font-style:normal;font-weight:400;font-display:block;src:url(${PDF_ASSETS.CAIRO_REGULAR_B64}) format('truetype')}
    @font-face{font-family:'Cairo';font-style:normal;font-weight:700;font-display:block;src:url(${PDF_ASSETS.CAIRO_BOLD_B64}) format('truetype')}
    *{box-sizing:border-box}html,body{margin:0;background:#eef3f8;color:#0a1932;font-family:${FONT_STACK}}
    .receipt{width:148mm;min-height:210mm;margin:0 auto;background:#fff;direction:rtl;position:relative;overflow:hidden}
    .top-line{height:3mm;background:linear-gradient(90deg,#d5ad4d,#f2d77d,#d5ad4d)}
    .header{padding:9mm 10mm 7mm;background:linear-gradient(145deg,#04152f 0%,#082b5d 72%,#0b3d7d 100%);color:#fff;position:relative;overflow:hidden}
    .header:before{content:'';position:absolute;width:72mm;height:72mm;border-radius:50%;left:-33mm;top:-38mm;border:12mm solid rgba(32,143,255,.10)}
    .brand-row{display:flex;align-items:center;justify-content:space-between;gap:6mm;position:relative;z-index:1}.brand-side{display:flex;align-items:center;gap:4mm}.logo-wrap,.logo-mark{width:19mm;height:19mm;border-radius:50%;background:#fff;border:1px solid rgba(244,199,93,.8);display:flex;align-items:center;justify-content:center;overflow:hidden}.logo-wrap img{width:16mm;height:16mm;object-fit:contain}.logo-mark{color:#082b5d;font-size:18pt;font-weight:800}.brand{font-size:18pt;font-weight:800;color:#f4cf70;line-height:1.3}.brand-en{font-size:7.5pt;letter-spacing:.5px;color:#cbd9ed;margin-top:1mm;direction:ltr;text-align:right}.receipt-title{text-align:left}.receipt-title strong{display:block;font-size:13pt}.receipt-title span{display:block;color:#f4cf70;font-size:8pt;margin-top:1mm}
    .meta{margin-top:7mm;display:grid;grid-template-columns:1fr 1fr;gap:3mm;position:relative;z-index:1}.meta-box{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);border-radius:3mm;padding:3mm}.meta-box span{display:block;color:#b8cae3;font-size:7.5pt}.meta-box strong{display:block;margin-top:1mm;font-size:9pt;direction:ltr;text-align:right;color:#fff}
    .body{padding:8mm 10mm 9mm}.section-title{display:flex;align-items:center;gap:2.5mm;margin-bottom:3.5mm;font-size:10pt;font-weight:800;color:#0a2b59}.section-title:before{content:'';width:3mm;height:3mm;border-radius:50%;background:#d5ad4d;box-shadow:0 0 0 1.5mm #fff5d8}
    table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #dbe4ef;border-radius:4mm;overflow:hidden;font-size:8.7pt;box-shadow:0 2mm 6mm rgba(13,37,69,.04)}td{padding:2.6mm 3.5mm;border-bottom:1px solid #e7edf4}.label{width:39%;font-weight:700;color:#38516f;background:#f6f8fb}.value{font-weight:700;color:#0a1932;background:#fff}tr:last-child td{border-bottom:0}
    .amount{margin-top:6mm;border:1px solid #e1c367;border-radius:4mm;background:linear-gradient(135deg,#fffdf6,#fff8df);padding:5mm 6mm;display:flex;align-items:center;justify-content:space-between;gap:5mm}.amount-copy span{display:block;color:#7c6a35;font-size:8pt}.amount-copy b{display:block;color:#0a2b59;font-size:9pt;margin-top:1mm}.amount-number{text-align:left;direction:ltr}.amount-number strong{display:block;color:#092654;font-size:23pt;line-height:1}.amount-number small{display:block;color:#8b7330;font-size:7pt;margin-top:1.5mm}
    .notice{margin-top:5mm;padding:3.5mm 4mm;border-right:1mm solid #0b5cab;background:#f4f8fd;border-radius:2mm;color:#52677f;font-size:7.5pt;line-height:1.8}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:10mm;text-align:center;color:#445b75;font-size:8pt}.signature{padding-top:8mm;border-top:1px solid #b9c5d3}.footer{position:absolute;right:10mm;left:10mm;bottom:7mm;padding-top:3mm;border-top:1px solid #dce4ed;display:flex;justify-content:space-between;align-items:center;gap:5mm;color:#718198;font-size:6.5pt}.footer strong{color:#0a2b59}.footer-en{direction:ltr;text-align:left}
  </style></head><body><main class="receipt">
    <div class="top-line"></div>
    <header class="header">
      <div class="brand-row"><div class="brand-side">${logo}<div><div class="brand">شركة الغدير</div><div class="brand-en">GHadeer Transport & Logistics</div></div></div><div class="receipt-title"><strong>وصل حمولة ${esc(data.loadType)}</strong><span>LOAD RECEIPT</span></div></div>
      <div class="meta"><div class="meta-box"><span>رقم الوصل</span><strong>${esc(data.receiptNumber)}</strong></div><div class="meta-box"><span>تاريخ الإصدار</span><strong>${esc(data.date || new Date().toLocaleString("en-GB"))}</strong></div></div>
    </header>
    <section class="body">
      <div class="section-title">بيانات الوصل والحمولة</div>
      <table><tbody>${rowsHtml}</tbody></table>
      <section class="amount"><div class="amount-copy"><span>المبلغ المستحق على العميل</span><b>إجمالي قيمة هذا الوصل</b></div><div class="amount-number"><strong>${money(data.amount)}</strong><small>AMOUNT DUE</small></div></section>
      <div class="notice">هذا الوصل صادر إلكترونيًا من نظام شركة الغدير لإثبات بيانات الحمولة والمبلغ المسجل على حساب العميل. يرجى الاحتفاظ بنسخة منه للرجوع إليها عند الحاجة.</div>
      <div class="signatures"><div class="signature">توقيع المستلم</div><div class="signature">توقيع وختم الشركة</div></div>
    </section>
    <footer class="footer"><div><strong>شركة الغدير</strong><br/>للنقل والخدمات اللوجستية</div><div class="footer-en">Generated electronically<br/>Ghadeer Logistics System</div></footer>
  </main></body></html>`;
}

export async function generateLoadReceiptPdf(data: LoadReceiptPdfData): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "170mm";
  iframe.style.height = "235mm";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(buildReceiptHtml(data));
    doc.close();
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      try {
        await Promise.all([fonts.load("400 16px Cairo"), fonts.load("700 16px Cairo")]);
      } catch {
        // Continue with fallback fonts.
      }
      if (fonts.ready) await fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
    const target = doc.querySelector(".receipt") as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 0, 0, pageW, Math.min(imgH, pageH));
    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
}
