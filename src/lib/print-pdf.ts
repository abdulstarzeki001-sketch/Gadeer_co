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
  wrapper.style.color = "#17233f";
  wrapper.style.direction = "rtl";
  wrapper.style.fontFamily = "Arial, Tahoma, sans-serif";
  wrapper.style.lineHeight = "1.7";
  wrapper.style.boxSizing = "border-box";
  wrapper.innerHTML = `
    <div style="padding:0 0 16px;border-bottom:3px solid #c9a14a;margin-bottom:20px;">
      <h1 style="margin:0 0 8px;color:#082451;font-size:28px;font-weight:900;text-align:center;">شركة الغدير</h1>
      <div style="color:#667085;text-align:center;font-size:15px;">${escapeHtml(title)}</div>
      <div style="display:flex;justify-content:space-between;gap:16px;margin-top:10px;color:#667085;font-size:12px;flex-wrap:wrap;">
        <span>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-IQ")}</span>
        <span>تقرير رسمي</span>
      </div>
    </div>
    ${body}
    <div style="margin-top:40px;display:flex;justify-content:space-between;gap:20px;border-top:2px solid #d9dfeb;padding-top:18px;">
      <div style="flex:1;text-align:center;border-top:1px solid #082451;padding-top:10px;color:#667085;font-size:13px;">توقيع المسؤول</div>
      <div style="flex:1;text-align:center;border-top:1px solid #082451;padding-top:10px;color:#667085;font-size:13px;">ختم الشركة</div>
    </div>
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
    let page = 1;

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      page += 1;
      position = -(imgHeight - pageHeight + margin * 2);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight - margin * 2;
    }

    const finalName = (fileName ?? `${title.replace(/\s+/g, "-")}.pdf`).trim() || "report.pdf";
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
