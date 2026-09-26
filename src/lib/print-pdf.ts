import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export async function downloadPdf(title: string, body: string) {
  try {
    // إنشاء عنصر HTML مؤقت
    const container = document.createElement("div");
    container.dir = "rtl";
    container.innerHTML = `
      <!doctype html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            color: #17233f;
            margin: 0;
            line-height: 1.7;
            direction: rtl;
            unicode-bidi: bidi-override;
            padding: 20px;
            background: #fff;
          }
          header {
            border-bottom: 3px solid #c9a14a;
            padding-bottom: 14px;
            margin-bottom: 20px;
            text-align: center;
          }
          header h1 {
            margin: 0 0 8px;
            color: #082451;
            font-size: 1.5rem;
            font-weight: 900;
          }
          .muted { color: #667085; font-size: 0.9rem; }
          .meta {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-top: 10px;
            font-size: 0.85rem;
            color: #667085;
            flex-wrap: wrap;
          }
          h2 {
            color: #082451;
            margin: 20px 0 12px;
            font-size: 1.1rem;
            font-weight: 800;
            border-bottom: 2px solid #c9a14a;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            background: #fff;
            border: 1px solid #d9dfeb;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: linear-gradient(135deg, #0a1a3a, #122859);
            color: #fff;
            padding: 12px;
            text-align: right;
            font-weight: 800;
            border-bottom: 2px solid #c9a14a;
            font-size: 0.9rem;
          }
          td {
            padding: 11px 12px;
            border-bottom: 1px solid #e5e8f0;
            text-align: right;
            font-size: 0.9rem;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 16px 0;
          }
          .card {
            border: 1px solid #d9dfeb;
            border-radius: 10px;
            padding: 14px;
            background: #f8fafc;
            text-align: center;
          }
          .card span {
            display: block;
            color: #667085;
            font-size: 0.8rem;
            margin-bottom: 6px;
          }
          .card b {
            display: block;
            font-size: 1.2rem;
            color: #082451;
            font-weight: 900;
          }
          .sign {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding-top: 30px;
            border-top: 2px solid #d9dfeb;
          }
          .sign-line {
            flex: 1;
            text-align: center;
            border-top: 1px solid #082451;
            padding-top: 8px;
            font-size: 0.85rem;
            color: #667085;
            margin-top: 50px;
          }
          @media print {
            body { background: #fff; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>شركة الغدير</h1>
          <div class="muted">${escapeHtml(title)}</div>
          <div class="meta">
            <span>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-IQ")}</span>
            <span>تقرير رسمي</span>
          </div>
        </header>
        ${body}
        <div class="sign">
          <div class="sign-line">توقيع المسؤول</div>
          <div class="sign-line">ختم الشركة</div>
        </div>
      </body>
      </html>
    `;

    // إضافة المحتوى مؤقتاً للـ DOM
    document.body.appendChild(container);

    // تحويل الـ HTML إلى صورة
    const canvas = await html2canvas(container, {
      scale: 2,
      allowTaint: true,
      useCORS: true,
      logging: false,
      backgroundColor: "#fff",
    });

    // إزالة العنصر المؤقت
    document.body.removeChild(container);

    // إنشاء PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // عرض A4
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // إضافة الصور للـ PDF
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // ارتفاع A4

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // تنزيل الملف
    const fileName = `${title.replace(/\s+/g, "-")}-${new Date().getTime()}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("خطأ في إنشاء PDF:", error);
    window.alert("حدث خطأ في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
  }
}

// دالة للطباعة المباشرة (بديل)
export function printPdf(title: string, body: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=980,height=760");
  if (!popup) {
    window.alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير بصيغة PDF.");
    return;
  }
  popup.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#17233f;margin:0;line-height:1.7}header{border-bottom:3px solid #c9a14a;padding-bottom:14px;margin-bottom:20px}header h1{margin:0;color:#082451}header .muted{color:#667085}.meta{display:flex;justify-content:space-between;gap:16px;margin-top:7px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.card{border:1px solid #d9dfeb;border-radius:10px;padding:12px;background:#f8fafc}.card b{display:block;font-size:1.1rem;color:#082451}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #d9dfeb;padding:9px;text-align:right}th{background:#082451;color:#fff}tr:nth-child(even){background:#f8fafc}.sign{margin-top:55px;display:flex;justify-content:space-between}
  </style></head><body><header><h1>شركة الغدير</h1><div class="muted">${escapeHtml(title)}</div><div class="meta"><span>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-IQ")}</span><span>تقرير رسمي</span></div></header>${body}<div class="sign"><span>توقيع المسؤول: __________</span><span>ختم الشركة: __________</span></div></body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => { popup.print(); popup.close(); }, 350);
}

export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

export function amount(value: unknown) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}
