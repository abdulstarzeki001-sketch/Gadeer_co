import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export async function downloadPdf(title: string, body: string, fileName?: string) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.padding = "22px";
  wrapper.style.background = "#f9fbff";
  wrapper.style.fontFamily = "Arial, Tahoma, sans-serif";
  wrapper.style.direction = "rtl";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.color = "#10213f";
  wrapper.style.lineHeight = "1.8";

  wrapper.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      body { color: #10213f; line-height: 1.8; }
      h1 { color: #0a1a3a; font-size: 30px; font-weight: 900; margin: 0 0 8px; text-align: center; }
      h2 {
        color: #0a1a3a;
        font-size: 20px;
        font-weight: 800;
        margin: 22px 0 12px;
        border-bottom: 3px solid #c9a14a;
        padding-bottom: 8px;
      }
      h3 {
        color: #16386d;
        font-size: 16px;
        font-weight: 800;
        margin: 12px 0 8px;
      }
      p, li, td, th, span, div {
        color: #1d2c48;
      }
      strong {
        color: #0a1a3a;
        font-weight: 800;
      }
      .header-shell {
        background: linear-gradient(135deg, #f9fbff 0%, #eef5ff 100%);
        border: 1px solid #d9e6ff;
        border-radius: 14px;
        padding: 18px 18px 14px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
      }
      .header-title {
        color: #0a1a3a;
        text-align: center;
        font-size: 28px;
        font-weight: 900;
        margin: 0 0 6px;
      }
      .header-subtitle {
        color: #3e5a80;
        text-align: center;
        font-size: 14px;
        font-weight: 700;
      }
      .header-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        color: #4b607f;
        font-size: 12px;
        flex-wrap: wrap;
      }
      .header-meta strong { color: #0a1a3a; }
      .section-box {
        background: linear-gradient(180deg, #ffffff 0%, #f7f9ff 100%);
        border: 1px solid #dfe8f6;
        border-radius: 12px;
        padding: 14px;
        margin: 14px 0;
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin: 16px 0;
      }
      .card {
        background: linear-gradient(135deg, #ffffff 0%, #f3f7ff 100%);
        border: 1px solid #dfe7f7;
        border-radius: 10px;
        padding: 14px 12px;
        box-shadow: 0 8px 18px rgba(9, 22, 42, 0.04);
      }
      .card-label {
        color: #586f92;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .card-value {
        color: #0a1a3a;
        font-size: 18px;
        font-weight: 900;
        line-height: 1.4;
      }
      .badge {
        display: inline-block;
        background: rgba(201,161,74,0.15);
        border: 1px solid #c9a14a;
        color: #8d6b1b;
        padding: 5px 10px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 800;
        margin: 0 5px 5px 0;
      }
      .positive { color: #0d8d4a; font-weight: 900; }
      .negative { color: #c83232; font-weight: 900; }
      .neutral { color: #1d5dd6; font-weight: 900; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        background: #fff;
        border: 1px solid #dfe7f6;
        border-radius: 10px;
        overflow: hidden;
      }
      th {
        background: linear-gradient(135deg, #0a1a3a 0%, #16386d 100%);
        color: #fff;
        padding: 12px 10px;
        text-align: right;
        font-weight: 800;
        border-bottom: 2px solid #c9a14a;
        font-size: 12px;
      }
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #ecf0f8;
        text-align: right;
        font-size: 12px;
        color: #162a4d;
      }
      tr:nth-child(even) td {
        background: #f7faff;
      }
      tr:hover td {
        background: #fff7e3;
      }
      .info-box {
        background: rgba(29,93,214,0.08);
        border-left: 4px solid #1d5dd6;
        border-radius: 8px;
        padding: 12px 14px;
        margin: 14px 0;
      }
      .info-box-text {
        color: #2048a5;
        font-size: 13px;
      }
      .sign-section {
        margin-top: 34px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
        border-top: 2px solid #dfe7f6;
        padding-top: 15px;
      }
      .sign-line {
        flex: 1;
        text-align: center;
        border-top: 1px solid #0a1a3a;
        padding-top: 8px;
        color: #586f92;
        font-size: 12px;
        font-weight: 700;
      }
      .footer-text {
        margin-top: 22px;
        text-align: center;
        color: #667a99;
        font-size: 11px;
        padding-top: 10px;
        border-top: 1px solid #dfe7f6;
      }
    </style>

    <div class="header-shell">
      <div class="header-title">شركة الغدير</div>
      <div class="header-subtitle">${escapeHtml(title)}</div>
      <div class="header-meta">
        <span><strong>التاريخ:</strong> ${new Date().toLocaleDateString("ar-IQ")}</span>
        <span><strong>الحالة:</strong> تقرير رسمي</span>
        <span><strong>التوثيق:</strong> صادر</span>
      </div>
    </div>
    ${body}
    <div class="sign-section">
      <div class="sign-line">توقيع المسؤول</div>
      <div class="sign-line">ختم الشركة</div>
    </div>
    <div class="footer-text">© 2026 شركة الغدير للنقل والتخليص الكمركي - جميع الحقوق محفوظة</div>
  `;

  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: "#f9fbff",
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

    const imgData = canvas.toDataURL("image/png");
    let heightLeft = imgHeight;
    let position = margin;

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

export function createInfoCard(label: string, value: string, type: "positive" | "negative" | "neutral" = "neutral") {
  const colorClass = type === "positive" ? "positive" : type === "negative" ? "negative" : "neutral";
  return `
    <div class="card">
      <div class="card-label">${escapeHtml(label)}</div>
      <div class="card-value ${colorClass}">${escapeHtml(value)}</div>
    </div>
  `;
}

export function createTableRow(cells: string[], isHeader: boolean = false) {
  const tag = isHeader ? "th" : "td";
  return `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
}

export function createBadge(text: string) {
  return `<span class="badge">${escapeHtml(text)}</span>`;
}
