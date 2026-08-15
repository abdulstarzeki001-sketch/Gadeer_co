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
  const rows = [
    ["رقم الوصل", data.receiptNumber],
    ["نوع الحمولة", `حمولة ${data.loadType}`],
    ["اسم العميل / الشركة", data.customerName],
    ["اسم السائق", data.driverName],
    ["نوع / تفاصيل الحمولة", data.cargoType],
    ...(data.vehicleNumber ? [["رقم العجلة", data.vehicleNumber]] : []),
    ...(data.destination ? [["الوجهة", data.destination]] : []),
    ...(data.unitAmount != null ? [["مبلغ الحمولة الواحدة", money(data.unitAmount)]] : []),
    ...(data.loadCount != null ? [["عدد الحمولات", String(data.loadCount)]] : []),
    ["التاريخ", data.date || new Date().toLocaleString("en-GB")],
  ];

  const rowsHtml = rows
    .map(([label, value]) => `<tr><td class="label">${esc(label)}</td><td>${esc(value)}</td></tr>`)
    .join("");

  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
    @font-face{font-family:'Cairo';font-style:normal;font-weight:400;font-display:block;src:url(${PDF_ASSETS.CAIRO_REGULAR_B64}) format('truetype')}
    @font-face{font-family:'Cairo';font-style:normal;font-weight:700;font-display:block;src:url(${PDF_ASSETS.CAIRO_BOLD_B64}) format('truetype')}
    *{box-sizing:border-box}html,body{margin:0;background:#fff;color:#0b1731;font-family:${FONT_STACK}}
    .receipt{width:148mm;min-height:205mm;margin:0 auto;padding:12mm;background:#fff;direction:rtl}
    .head{border-radius:18px;padding:8mm;background:linear-gradient(145deg,#062653,#03162f);color:#fff;position:relative;overflow:hidden}
    .head:after{content:'';position:absolute;width:65mm;height:65mm;border-radius:50%;left:-24mm;top:-34mm;background:rgba(17,140,255,.22)}
    .brand{font-size:19pt;font-weight:800;color:#f4c75d}.sub{margin-top:2mm;font-size:9pt;color:#dce8fa}.type{margin-top:5mm;display:inline-block;border:1px solid rgba(244,199,93,.5);border-radius:999px;padding:2mm 4mm;color:#f4c75d;font-weight:700}
    table{width:100%;border-collapse:separate;border-spacing:0;margin-top:7mm;border:1px solid #dbe5f3;border-radius:14px;overflow:hidden;font-size:9.5pt}
    td{padding:3mm 3.5mm;border-bottom:1px solid #e7edf6;background:#fff}.label{width:40%;font-weight:700;color:#173463;background:#f5f8fc}tr:last-child td{border-bottom:0}
    .amount{margin-top:7mm;border:1px solid #e4c76e;border-radius:16px;background:#fff9e9;padding:6mm;text-align:center}.amount span{display:block;color:#6c5730;font-size:9pt}.amount strong{display:block;margin-top:2mm;color:#0b1731;font-size:24pt;direction:ltr}.currency{font-size:9pt;color:#6c5730;margin-top:1mm}
    .foot{text-align:center;margin-top:8mm;padding-top:4mm;border-top:1px solid #dbe5f3;color:#738198;font-size:8pt;line-height:1.8}
  </style></head><body><main class="receipt">
    <section class="head"><div class="brand">شركة الغدير</div><div class="sub">للنقل والتخليص الكمركي • Ghadeer Logistics</div><div class="type">وصل حمولة ${esc(data.loadType)}</div></section>
    <table><tbody>${rowsHtml}</tbody></table>
    <section class="amount"><span>المبلغ المستحق</span><strong>${money(data.amount)}</strong><div class="currency">المبلغ المسجل على الوصل</div></section>
    <footer class="foot">تم إصدار هذا الوصل إلكترونيًا من نظام شركة الغدير.<br/>يرجى الاحتفاظ بنسخة PDF للرجوع إليها عند الحاجة.</footer>
  </main></body></html>`;
}

export async function generateLoadReceiptPdf(data: LoadReceiptPdfData): Promise<Blob> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "170mm";
  iframe.style.height = "230mm";
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
    await new Promise((resolve) => setTimeout(resolve, 100));
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
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, Math.min(imgH, pageH));
    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
}
