import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { escapeHtml } from "./print-pdf";
import { buildCustomerStatement, IQD_PER_USD, type StatementTransaction, type StatementDocument } from "./customer-statement";

type Input = { customer: string; items: StatementTransaction[]; documents: StatementDocument[]; from?: string; to?: string };
const money = (n: number) => new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n) + " USD";
const dinars = (n: number) => new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n) + " IQD";
const displayDate = (value: string, withTime = false) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Baghdad",day:"2-digit",month:"2-digit",year:"numeric",...(withTime?{hour:"2-digit",minute:"2-digit",hour12:false}:{})}).format(d);
};

export async function downloadCustomerStatement(input: Input) {
  const report = buildCustomerStatement(input.items,input.documents);
  const root = document.createElement("div");
  root.className = "statement-print-root";
  root.style.cssText = "position:fixed;left:-11000px;top:0;width:794px;pointer-events:none;z-index:-1";
  root.innerHTML = "<style>" + styles + "</style>";
  document.body.appendChild(root);
  const pages: HTMLDivElement[] = [];
  const stamp = displayDate(new Date().toISOString());
  const logo = new URL(import.meta.env.BASE_URL + "ghadeer-logo.png", window.location.origin).href;
  const commonHeader = '<header class="statement-head"><div class="brand"><img src="' + escapeHtml(logo) + '" alt="GHADEER"/><div><h1>شركة الغدير</h1></div></div><div class="issued"><span>▦ &nbsp; التاريخ</span><strong dir="ltr">' + stamp + '</strong></div></header>';
  const period = 'كشف حساب العميل — ' + escapeHtml(input.customer) + ' · ' + (input.from || input.to ? 'الفترة: ' + escapeHtml(input.from || "البداية") + ' — ' + escapeHtml(input.to || "حتى الآن") : "جميع الحركات");
  let page: HTMLDivElement;
  let content: HTMLDivElement;
  // The branded company/date header appears only on the first dues page, first receipts page, and settlement page. Continuations have only their table title.
  const newPage = (showHeader = false) => {
    page = document.createElement("div");
    page.className = "gh-statement";
    page.dir = "rtl";
    page.classList.toggle("with-header", showHeader);
    page.innerHTML = (showHeader ? commonHeader + '<div class="period">' + period + ' · المستحقات بالدولار — القبوض بالدينار · 1 USD = ' + new Intl.NumberFormat("en-US").format(IQD_PER_USD) + ' IQD</div>' : "") + '<main class="statement-content"></main><footer><span class="footer-rule"></span><span>شركة الغدير</span><span class="page-number"></span><span class="footer-rule"></span></footer>';
    root.appendChild(page);
    content = page.querySelector<HTMLDivElement>(".statement-content")!;
    pages.push(page);
  };
  const fits = () => content.getBoundingClientRect().bottom <= page.getBoundingClientRect().top + 1053;
  const appendBlock = (html: string) => {
    const block = document.createElement("div");
    block.innerHTML = html;
    content.appendChild(block);
    if (!fits()) {
      block.remove();
      newPage();
      content.appendChild(block);
    }
    if (!fits()) throw new Error("أحد أقسام الكشف أطول من صفحة. اختصر الوصف ثم حاول مجدداً.");
  };
  const banner = (title: string, glyph: string) => '<h3 class="section-banner"><span>' + escapeHtml(title) + '</span><span class="banner-icon">' + glyph + '</span></h3>';
  const tableSection = (title: string, columns: string[], widths: number[], rows: string[], total: string, unit: string) => {
    let wrapper: HTMLDivElement;
    let tbody: HTMLTableSectionElement;
    const start = (cont = false) => {
      wrapper = document.createElement("div");
      wrapper.className = "table-section";
      wrapper.innerHTML = banner(cont ? (unit === "IQD" ? "تابع القبوضات" : "تابع المستحقات") : title, "▤") + '<table><colgroup>' + widths.map(w=>'<col style="width:' + w + '%">').join("") + '</colgroup><thead><tr>' + columns.map(c=>'<th>' + escapeHtml(c) + '</th>').join("") + '</tr></thead><tbody></tbody></table>';
      content.appendChild(wrapper);
      tbody = wrapper.querySelector("tbody")!;
    };
    start();
    for (const entry of rows.length ? rows : ['<td colspan="' + columns.length + '" class="empty">لا توجد حركات.</td>']) {
      const row = document.createElement("tr");
      row.innerHTML = entry;
      tbody!.appendChild(row);
      if (!fits()) {
        row.remove();
        if (!tbody!.children.length) wrapper!.remove();
        newPage();
        start(true);
        tbody!.appendChild(row);
      }
      if (!fits()) throw new Error("وصف إحدى الحركات طويل جداً لصفحة الكشف.");
    }
    appendBlock('<div class="table-total"><span>عدد الحركات: <b dir="ltr">' + rows.length + '</b></span><span>' + (unit==="IQD"?"مجموع القبوض":"مجموع المستحقات") + '</span><strong dir="ltr">' + total + '</strong></div>');
  };
  const card = (title: string, amount: string, cls: string, glyph: string) =>
    '<div class="summary-card ' + cls + '"><div class="summary-icon">' + glyph + '</div><div><span>' + title + '</span><strong dir="ltr">' + amount + '</strong></div></div>';
  const settlementRow = (title: string, amount: string, icon: string, cls="") =>
    '<div class="settlement-row ' + cls + '"><span class="settlement-label">' + title + '</span><strong dir="ltr">' + amount + '</strong><span class="settlement-icon">' + icon + '</span></div>';
  try {
    await document.fonts.ready;
    newPage(true);
    appendBlock('<div class="statement-summary">' +
      card("إجمالي المستحقات",money(report.dueTotal),"gold","▤") +
      card("التنزيلات بالدولار",money(report.receiptTotal),"teal","≋") +
      card("الرصيد المتبقي",money(report.balance),"navy","▣") +
      '</div>');
    tableSection("الحركات المستحقة (بالدولار)",["التاريخ","الرقم","اسم السائق ورقم السيارة","اسم الشركة والوصف","المبلغ USD"],[13,18,22,29,18],
      report.dues.map(row=>'<td dir="ltr">'+displayDate(row.date)+'</td><td dir="ltr">'+escapeHtml(row.number)+'</td><td><b>'+escapeHtml(row.driver)+'</b><br/><span dir="ltr">'+escapeHtml(row.vehicle)+'</span></td><td><b>'+escapeHtml(row.company)+'</b><br/>'+escapeHtml(row.description)+'</td><td class="money" dir="ltr">'+money(row.amount)+'</td>'),money(report.dueTotal),"USD");

    newPage(true);
    tableSection("حركات القبض (بالدينار العراقي)",["التاريخ","اسم المرسل / الملاحظات","المبلغ المستلم","العملة"],[21,49,23,7],
      report.receipts.map(row=>'<td dir="ltr">'+displayDate(row.date)+'</td><td><b>'+escapeHtml(row.sender)+'</b><br/><span class="detail">طريقة الإرسال: '+escapeHtml(row.method)+(row.note?'<br/>'+escapeHtml(row.note):"")+'</span></td><td class="money" dir="ltr">'+(row.currency==="IQD"?dinars(row.amount):money(row.amount))+'</td><td dir="ltr">'+escapeHtml(row.currency)+'</td>'),dinars(report.receiptIqdTotal),"IQD");

    // Always start settlement on its own page, with the branded header.
    newPage(true);
    appendBlock('<div class="settlement">' + banner("تسوية القبوض والمستحقات","⚙") +
      settlementRow("مجموع القبوض بالدينار العراقي",dinars(report.receiptIqdTotal),"≋") +
      settlementRow("التحويل إلى الدولار (مجموع الدينار ÷ "+new Intl.NumberFormat("en-US").format(IQD_PER_USD)+")",money(report.receiptIqdTotal/IQD_PER_USD),"⇄") +
      settlementRow("إجمالي المستحقات بالدولار",money(report.dueTotal),"▤") +
      settlementRow("إجمالي التنزيلات بالدولار",money(report.receiptTotal),"−") +
      settlementRow("المتبقي من المستحقات بالدولار",money(report.balance),"▣","final") + '</div>');
    appendBlock('<div class="statement-notes">'+banner("ملاحظات","▤")+
      '<p>1. جميع القبوض المحفوظة بالدينار العراقي تجمع أولاً، ثم تحوّل إلى الدولار على أساس '+new Intl.NumberFormat("en-US").format(IQD_PER_USD)+' دينار لكل دولار.</p>'+
      '<p>2. يُخصم المبلغ المحوّل، إضافةً إلى أي قبوض قديمة مسجّلة بالدولار، من مجموع المستحقات بالدولار.</p></div>');

    const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    for (let index=0;index<pages.length;index++) {
      const sheet = pages[index];
      sheet.querySelector(".page-number")!.textContent=(index+1)+" / "+pages.length;
      for (const img of Array.from(sheet.querySelectorAll("img"))) {
        try { await img.decode(); } catch { throw new Error("تعذر تحميل شعار الغدير؛ تحقق من الاتصال."); }
      }
      const canvas=await html2canvas(sheet,{scale:2,backgroundColor:"#FFFFFF",useCORS:true,logging:false});
      if(index) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,210,297,undefined,"FAST");
      canvas.width=0;canvas.height=0;
    }
    pdf.save("كشف-حساب-"+input.customer.replace(/[\\/:*?"<>|]/g,"-")+"-"+new Date().toISOString().slice(0,10)+".pdf");
  } finally { root.remove(); }
}

const styles = `
.gh-statement{--navy:#0a2447;--navy2:#104477;--gold:#d6a64b;--line:#d8e0e8;box-sizing:border-box;width:794px;height:1122px;padding:0 19px 47px;background:#fff;color:#102343;font:12px/1.65 Arial,Tahoma,sans-serif;position:relative;overflow:hidden}
.gh-statement *{box-sizing:border-box}
.gh-statement .statement-head{height:106px;margin:0 -19px 10px;padding:13px 24px 12px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#082041 0%,#143c72 55%,#092447 100%);color:white;border-bottom:4px solid #d6a64b}
.gh-statement .brand{display:flex;align-items:center;gap:14px;min-width:0}.gh-statement .brand img{width:79px;height:79px;object-fit:contain}.gh-statement h1{margin:0;font-size:27px;line-height:1.2;color:#fff;font-weight:900}.gh-statement h2{margin:5px 0 0;color:#fff;font-size:14px;font-weight:700}
.gh-statement .issued{display:flex;flex-direction:column;align-items:flex-start;gap:3px;color:#fff;font-size:12px}.gh-statement .issued span{color:#f7d681}
.gh-statement .period{border-bottom:1px solid #d6a64b;text-align:center;padding:0 0 9px;margin-bottom:12px;font-size:10px;color:#263e5a}
.gh-statement .statement-summary{display:flex;gap:9px;margin-bottom:15px}.gh-statement .summary-card{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:12px 11px;height:80px;color:white;border-radius:10px;background:linear-gradient(120deg,#073060,#114e83)}
.gh-statement .summary-card.teal{background:linear-gradient(120deg,#0b4370,#157dad)}.gh-statement .summary-card.gold{background:linear-gradient(115deg,#9d6e2b,#d0a54f 58%,#76521f)}.gh-statement .summary-icon{display:grid;place-items:center;flex:0 0 39px;width:39px;height:39px;border-radius:50%;background:#ffdfa0;color:#092746;font-size:22px;font-weight:900}
.gh-statement .summary-card>div:last-child{flex:1;min-width:0}.gh-statement .summary-card span{display:block;font-size:12px;font-weight:bold}.gh-statement .summary-card strong{display:block;font-size:17px;white-space:nowrap;letter-spacing:-.2px;text-align:right}
.gh-statement .section-banner{display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(110deg,#09305b,#112b4c);border-radius:9px 9px 0 0;border-bottom:3px solid #d6a64b;color:white;padding:8px 12px;margin:14px 0 4px;font-size:16px;line-height:1.35;font-weight:900}.gh-statement .banner-icon{color:#ffdc8b}
.gh-statement table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0;border:1px solid var(--line)}.gh-statement thead th{padding:8px 5px;background:#102e55!important;color:#fff!important;font-size:11px;font-weight:800;border:1px solid #345273;border-bottom:2px solid #d6a64b;text-align:right}
.gh-statement tbody td{background:#fff!important;color:#102343!important;border:1px solid #d8e0e8;padding:7px 6px;text-align:right;vertical-align:top;font-size:10px;line-height:1.5;overflow-wrap:anywhere;white-space:normal}
.gh-statement tbody tr:nth-child(even) td{background:#f2f7fc!important}.gh-statement .money{font-weight:900;font-size:11px;white-space:nowrap;color:#0b3160!important}.gh-statement .detail{color:#43546b;font-size:10px}.gh-statement .empty{text-align:center;padding:25px}
.gh-statement .table-total{display:flex;align-items:center;justify-content:space-between;gap:11px;margin:10px 0 13px;padding:11px 13px;border:1px solid #e6bd73;background:linear-gradient(110deg,#fff9ec,#ffe7b7,#fffaf0);border-radius:9px;font-size:14px;font-weight:800}.gh-statement .table-total strong{font-size:19px;color:#102343}
.gh-statement .settlement-row{display:flex;align-items:center;gap:12px;padding:7px 11px;border-bottom:1px solid #d7dee7;font-size:12px}.gh-statement .settlement-row .settlement-icon{order:-1;display:grid;place-items:center;flex:0 0 33px;height:33px;border-radius:50%;background:#ffdf9c;color:#102343;font-size:20px}.gh-statement .settlement-label{flex:1;font-weight:700}.gh-statement .settlement-row strong{font-size:16px;color:#08396e;min-width:155px;text-align:left}.gh-statement .settlement-row.final{margin-top:5px;border:1px solid #e7b65d;background:linear-gradient(115deg,#ffefcd,#f9d58e,#ffefd1);border-radius:9px}.gh-statement .settlement-row.final strong{font-size:21px;color:#102343}
.gh-statement .statement-notes{margin-top:11px;border:1px solid var(--line);border-radius:9px;overflow:hidden}.gh-statement .statement-notes .section-banner{margin:0;border-radius:0}.gh-statement .statement-notes p{margin:5px 13px;font-size:11px}
.gh-statement footer{position:absolute;bottom:15px;right:22px;left:22px;display:flex;justify-content:center;align-items:center;gap:15px;font-size:10px;color:#253c57}.gh-statement .footer-rule{height:1px;flex:1;background:#d6a64b}
`;