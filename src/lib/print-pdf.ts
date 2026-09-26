import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export async function downloadPdf(title: string, body: string, fileName?: string) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.padding = "20px";
  wrapper.style.background = "#ffffff";
  wrapper.style.fontFamily = "Arial, Tahoma, sans-serif";
  wrapper.style.direction = "rtl";
  wrapper.style.boxSizing = "border-box";
  wrapper.innerHTML = `
    <style>
      body { color: #1a2540; line-height: 1.8; }
      h1 { color: #0a1a3a; font-size: 28px; font-weight: 900; margin: 0 0 8px; text-align: center; }
      h2 { color: #082451; font-size: 18px; font-weight: 800; margin: 24px 0 12px; border-bottom: 3px solid #c9a14a; padding-bottom: 8px; }
      h3 { color: #122859; font-size: 15px; font-weight: 700; margin: 12px 0 8px; }
      p { color: #17233f; margin: 8px 0; font-size: 14px; }
      strong { color: #0a1a3a; font-weight: 800; }
      span { color: #667085; }
      .header-line { color: #c9a14a; border-bottom: 3px solid #c9a14a; padding-bottom: 14px; margin-bottom: 20px; }
      .header-title { color: #082451; text-align: center; font-size: 26px; font-weight: 900; margin: 0 0 6px; }
      .header-subtitle { color: #667085; text-align: center; font-size: 14px; }
      .header-meta { display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; color: #667085; font-size: 12px; flex-wrap: wrap; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #fff; border: 1px solid #d9dfeb; }
      th { background: linear-gradient(135deg, #0a1a3a, #122859); color: #fff; padding: 12px; text-align: right; font-weight: 800; border-bottom: 2px solid #c9a14a; font-size: 13px; }
      td { padding: 11px 12px; border-bottom: 1px solid #e5e8f0; text-align: right; font-size: 13px; color: #1a2540; }
      tr:nth-child(even) td { background: #f8fafc; }
      tr:hover td { background: #fff8e7; }
      .card { border: 1px solid #d9dfeb; border-radius: 10px; padding: 14px; background: linear-gradient(135deg, #f8fafc 0%, #fff8e7 100%); margin: 10px 0; }
      .card-label { color: #667085; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .card-value { color: #0a1a3a; font-size: 18px; font-weight: 900; }
      .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
      .badge { display: inline-block; background: rgba(201,161,74,0.15); border: 1px solid #c9a14a; color: #8a6a1f; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin: 0 4px 4px 0; }
      .section-title { color: #082451; font-size: 16px; font-weight: 800; margin-top: 20px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #c9a14a; }
      .positive { color: #16a34a; font-weight: 800; }
      .negative { color: #dc2626; font-weight: 800; }
      .neutral { color: #2563eb; font-weight: 800; }
      .info-box { background: rgba(37,99,235,0.08); border-left: 4px solid #2563eb; padding: 12px; margin: 12px 0; border-radius: 6px; }
      .info-box-text { color: #1e3a8a; font-size: 13px; }
      .sign-section { margin-top: 40px; display: flex; justify-content: space-between; gap: 20px; border-top: 2px solid #d9dfeb; padding-top: 18px; }
      .sign-line { flex: 1; text-align: center; border-top: 1px solid #0a1a3a; padding-top: 10px; color: #667085; font-size: 13px; font-weight: 700; }
      .footer-text { color: #667085; text-align: center; font-size: 11px; margin-top: 20px; padding-top: 12px; border-top: 1px solid #d9dfeb; }
    </style>
    <div class="header-line">
      <div class="header-title">شركة الغدير</div>
      <div class="header-subtitle">${escapeHtml(title)}</div>
      <div class="header-meta">
        <span><strong>التاريخ:</strong> ${new Date().toLocaleDateString("ar-IQ")}</span>
        <span><strong>الحالة:</strong> تقرير رسمي</span>
        <span><strong>التوقيع:</strong> معتمد</span>
      </div>
    </div>
    ${body}
    <div class="sign-section">
      <div class="sign-line">توقيع المسؤول: _____________</div>
      <div class="sign-line">ختم الشركة: _____________</div>
    </div>
    <div class="footer-text">© 2026 شركة الغدير للنقل والتخليص الكمركي - جميع الحقوق محفوظة</div>
  `;

  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = -(imgHeight - pageHeight + margin * 2);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight - margin * 2;
    }

    const finalName = (fileName ?? `${title.replace(/\s+/g, "-")}-${new Date().getTime()}.pdf`).trim() || "report.pdf";
    pdf.save(finalName);
  } catch (error) {
    console.error("PDF generation failed:", error);
    window.alert("حدث خطأ أثناء إنشاء ملف PDF. حاول مرة أخرى.");
  } finally {
    wrapper.remove();
  }
}

export async function printPdf(title: string, body: string, fileName?: string) {
  await downloadPdf(title, body, fileName);
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function amount(value: unknown) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

// مساعد لإنشاء بطاقات المعلومات بألوان جميلة
export function createInfoCard(label: string, value: string, type: "positive" | "negative" | "neutral" = "neutral") {
  const colorClass = type === "positive" ? "positive" : type === "negative" ? "negative" : "neutral";
  return `
    <div class="card">
      <div class="card-label">${escapeHtml(label)}</div>
      <div class="card-value ${colorClass}">${escapeHtml(value)}</div>
    </div>
  `;
}

// مساعد لإنشاء صفوف الجدول بألوان متناوبة
export function createTableRow(cells: string[], isHeader: boolean = false) {
  const tag = isHeader ? "th" : "td";
  return `<tr>${cells.map(cell => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
}

// مساعد لإنشاء شارة Badge
export function createBadge(text: string) {
  return `<span class="badge">${escapeHtml(text)}</span>`;
}
