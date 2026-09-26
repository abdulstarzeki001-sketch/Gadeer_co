export function printPdf(title: string, body: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=980,height=760");
  if (!popup) {
    window.alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير بصيغة PDF.");
    return;
  }
  popup.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#17233f;margin:0;line-height:1.7}header{border-bottom:3px solid #c9a14a;padding-bottom:14px;margin-bottom:20px}h1{margin:0;color:#082451;font-size:24px}h2{color:#082451;margin:18px 0 8px;font-size:18px}.muted{color:#667085}.meta{display:flex;justify-content:space-between;gap:16px;margin-top:7px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.card{border:1px solid #d9dfeb;border-radius:10px;padding:12px;background:#f8fafc}.card b{display:block;font-size:18px;color:#082451}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #d9dfeb;padding:9px;text-align:right}th{background:#082451;color:#fff}tr:nth-child(even){background:#f8fafc}.sign{margin-top:55px;display:flex;justify-content:space-between}@media print{button{display:none}}
  </style></head><body><header><h1>شركة الغدير</h1><div class="muted">${escapeHtml(title)}</div><div class="meta"><span>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-IQ")}</span><span>تقرير رسمي</span></div></header>${body}<div class="sign"><span>توقيع المسؤول: __________</span><span>ختم الشركة: __________</span></div></body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => { popup.print(); popup.close(); }, 350);
}

export function escapeHtml(value: unknown) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
export function amount(value: unknown) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0); }
