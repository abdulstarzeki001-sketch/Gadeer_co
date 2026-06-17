import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function renderElementToCanvas(element: HTMLElement) {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
}

export function canvasToPdf(canvas: HTMLCanvasElement) {
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
  return pdf;
}

export async function exportElementToPdf(element: HTMLElement, fileName: string) {
  const canvas = await renderElementToCanvas(element);
  const pdf = canvasToPdf(canvas);
  pdf.save(fileName);
}
