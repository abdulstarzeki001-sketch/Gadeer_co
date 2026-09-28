import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { escapeHtml } from "./print-pdf";
import { buildCustomerStatement, type StatementTransaction, type StatementDocument } from "./customer-statement";

type Input = { customer: string; items: StatementTransaction[]; documents: StatementDocument[]; from?: string; to?: string };
const money = (value: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " USD";
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baghdad", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
};

export async function downloadCustomerStatement(input: Input) {
  const report = buildCustomerStatement(input.items, input.documents);
  const root = document.createElement("div");
  root.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;pointer-events:none";
  root.innerHTML = '<style>' + styles + '</style>';
  document.body.appendChild(root);
  const pages: HTMLDivElement[] = [];
  const issued = date(new Date().toISOString());
  const logo = new URL(import.meta.env.BASE_URL + "ghadeer-logo.png", window.location.origin).href;
  const header = '<header><img src="' + escapeHtml(logo) + '" alt="شعار شركة الغدير"/><div><h1>شركة الغدير</h1><h2>كشف حساب العميل — ' + escapeHtml(input.customer) + '</h2></div><div class="issued">التاريخ<br/><b dir="ltr">' + issued + '</b></div></header>';
  const period = input.from || input.to ? 'الفترة: ' + escapeHtml(input.from || "البداية") + ' — ' + escapeHtml(input.to || "حتى الآن") : "جميع الحركات";
  let page: HTMLDivElement;
  let content: HTMLDivElement;
  const newPage = () => {
    page = document.createElement("div");
    page.className = "gh-statement";
    page.dir = "rtl";
    page.innerHTML = header + '<div class="period">' + period + ' · العملة: الدولار الأمريكي USD</div><div class="statement-content"></div><footer></footer>';
    root.appendChild(page);
    content = page.querySelector<HTMLDivElement>(".statement-content")!;
    pages.push(page);
  };
  const fits = () => content.getBoundingClientRect().bottom <= page.getBoundingClientRect().top + 1040;
  const appendBlock = (html: string) => {
    const block = document.createElement("div");
    block.innerHTML = html;
    content.appendChild(block);
    if (!fits()) { block.remove(); newPage(); content.appendChild(block); }
    if (!fits()) throw new Error("النص طويل جداً لصفحة الكشف؛ اختصر الوصف وحاول مجدداً.");
  };
  const section = (title: string, columns: string[], widths: number[], rows: string[], total: number) => {
    let box: HTMLDivElement;
    let tbody: HTMLTableSectionElement;
    const start = (continued = false) => {
      box = document.createElement("div");
      box.innerHTML = '<h3>' + title + (continued ? ' — تابع' : '') + '</h3><table><colgroup>' + widths.map(width => '<col style="width:' + width + '%"/>').join("") + '</colgroup><thead><tr>' + columns.map(column => '<th>' + column + '</th>').join("") + '</tr></thead><tbody></tbody></table>';
      content.appendChild(box);
      tbody = box.querySelector("tbody")!;
    };
    start();
    for (const html of rows.length ? rows : ['<td colspan="' + columns.length + '">لا توجد حركات.</td>']) {
      const row = document.createElement("tr");
      row.innerHTML = html;
      tbody!.appendChild(row);
      if (!fits()) {
        row.remove();
        const continued = tbody!.children.length > 0;
        if (!continued) box!.remove();
        newPage();
        start(continued);
        tbody!.appendChild(row);
      }
      if (!fits()) throw new Error("أحد أوصاف الحركات أطول من صفحة؛ اختصره قبل إصدار الكشف.");
    }
    appendBlock('<div class="section-total"><span>عدد الحركات: <b>' + rows.length + '</b></span><span>' + (title === "حركات القبض" ? "مجموع القبوض" : "مجموع المستحقات") + ': <b dir="ltr">' + money(total) + '</b></span></div>');
  };
  try {
    await document.fonts.ready;
    newPage();
    appendBlock('<div class="statement-summary">' + [
      ["إجمالي المستحقات", report.dueTotal],
      ["إجمالي التنزيلات", report.receiptTotal],
      ["الرصيد", report.balance],
    ].map(([label, value]) => '<div><span>' + label + '</span><strong dir="ltr">' + money(Number(value)) + '</strong></div>').join("") + '</div>');
    section("الحركات المستحقة", ["التاريخ", "الرقم", "اسم السائق ورقم السيارة", "اسم الشركة والوصف", "المبلغ USD"], [13, 18, 22, 29, 18],
      report.dues.map(row => '<td dir="ltr">' + date(row.date) + '</td><td dir="ltr">' + escapeHtml(row.number) + '</td><td><b>' + escapeHtml(row.driver) + '</b><br/><span dir="ltr">' + escapeHtml(row.vehicle) + '</span></td><td><b>' + escapeHtml(row.company) + '</b><br/>' + escapeHtml(row.description) + '</td><td class="money" dir="ltr">' + money(row.amount) + '</td>'), report.dueTotal);
    section("حركات القبض", ["التاريخ", "اسم المرسل وكيفية الإرسال", "المبلغ المستلم USD"], [18, 58, 24],
      report.receipts.map(row => '<td dir="ltr">' + date(row.date) + '</td><td><b>' + escapeHtml(row.sender) + '</b><br/>طريقة الإرسال: ' + escapeHtml(row.method) + (row.note ? '<br/>' + escapeHtml(row.note) : '') + '</td><td class="money" dir="ltr">' + money(row.amount) + '</td>'), report.receiptTotal);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    for (let index = 0; index < pages.length; index++) {
      const sheet = pages[index];
      sheet.querySelector("footer")!.textContent = "شركة الغدير · " + (index + 1) + " / " + pages.length;
      for (const img of Array.from(sheet.querySelectorAll("img"))) {
        try { await img.decode(); } catch { throw new Error("تعذر تحميل شعار الغدير. أعد المحاولة بعد التأكد من الاتصال."); }
      }
      const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      if (index) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 8, 8, 194, 194 * canvas.height / canvas.width, undefined, "FAST");
      canvas.width = 0;
      canvas.height = 0;
    }
    pdf.save("كشف-حساب-" + input.customer.replace(/[\\/:*?"<>|]/g, "-") + "-" + new Date().toISOString().slice(0, 10) + ".pdf");
  } finally { root.remove(); }
}

const styles = `
.gh-statement{box-sizing:border-box;width:794px;height:1120px;padding:24px 26px 45px;background:#fff;color:#202630;font:13px/1.7 Arial,Tahoma,sans-serif;position:relative}
.gh-statement *{box-sizing:border-box}.gh-statement header{display:flex;align-items:center;gap:18px;border-bottom:3px solid #b98b38;padding:0 0 15px}
.gh-statement header img{width:78px;height:78px;object-fit:contain}.gh-statement header>div:nth-child(2){flex:1}
.gh-statement h1{margin:0;color:#202630;font-size:26px}.gh-statement h2{margin:4px 0 0;font-size:16px;color:#454545}
.gh-statement .issued{font-size:12px;text-align:center;white-space:nowrap}.gh-statement .period{font-size:11px;color:#666;margin:8px 0 14px}
.gh-statement .statement-summary{display:flex;gap:12px;margin:0 0 20px}.gh-statement .statement-summary>div{flex:1;border:1px solid #d5c29e;border-top:3px solid #b98b38;border-radius:9px;background:#fbf8f1;padding:12px}
.gh-statement .statement-summary span{display:block;font-size:12px;color:#59534b}.gh-statement .statement-summary strong{display:block;font-size:20px;margin-top:5px;color:#202630;text-align:right}
.gh-statement h3{margin:17px 0 9px;font-size:17px;color:#202630;border-bottom:1px solid #d5c29e;padding-bottom:6px}
.gh-statement table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0}.gh-statement th{background:#202630;color:#f7e3bb;font-size:12px;text-align:right;padding:9px 7px;border:1px solid #454a53}
.gh-statement td{padding:8px 7px;border:1px solid #e4e0d8;font-size:12px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap;text-align:right}
.gh-statement tr:nth-child(even) td{background:#faf8f4}.gh-statement .money{font-weight:bold;font-size:12px;white-space:normal}
.gh-statement .section-total{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:#f4eee1;border:1px solid #d5c29e;margin:8px 0 18px}
.gh-statement footer{position:absolute;bottom:15px;right:26px;left:26px;border-top:1px solid #d5c29e;padding-top:6px;text-align:center;font-size:11px;color:#666}
`;
