import { isDebtIncrease as isIncoming, customerBalance } from "@/lib/customer-ledger";
import { activeCustomers, activeTransactions } from "@/lib/customer-trash";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Filter,
  Gauge,
  Phone,
  RefreshCcw,
  Search,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCustomerStatement } from "@/lib/customer-statement-pdf";
import { collectionDescription, type StatementDocument } from "@/lib/customer-statement";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "تقارير العملاء | لوحة التحكم" },
      { name: "description", content: "تقارير مالية تفصيلية لكل عميل مع كامل البيانات والملخص النهائي." },
    ],
  }),
  component: ReportsPage,
});

type Trader = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

type Transaction = {
  id: string;
  trader_id: string | null;
  company_id: string;
  document_id: string | null;
  document_number: string | null;
  amount: number;
  type: string;
  description: string | null;
  cargo_typedetails: string | null;
  created_at: string;
  driver_name: string | null;
};

type ReportStats = {
  incoming: number;
  outgoing: number;
  balance: number;
  count: number;
  incomingCount: number;
  outgoingCount: number;
  documents: number;
  average: number;
  firstDate: string | null;
  lastDate: string | null;
};

function ReportsPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTraderId, setSelectedTraderId] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void loadReportData(); }, []);

  async function loadReportData() {
    setLoading(true);
    setError(null);
    try {
      const { data: tradersData, error: tradersError } = await activeCustomers(supabase).order("name");
      if (tradersError) throw tradersError;
      const rows: Transaction[] = [];
      // Fetch every page, so the PDF totals never silently stop at the API row limit.
      for (let offset = 0; ; offset += 500) {
        const { data, error: txError } = await activeTransactions(supabase)
          .order("created_at", { ascending: false }).order("id")
          .range(offset, offset + 499);
        if (txError) throw txError;
        rows.push(...((data ?? []) as Transaction[]));
        if ((data ?? []).length < 500) break;
      }
      setTraders((tradersData ?? []) as Trader[]);
      setTransactions(rows);
      setSelectedTraderId(current => current || tradersData?.[0]?.id || "");
    } catch (caught) {
      setTransactions([]);
      setError(caught instanceof Error ? caught.message : "تعذر تحميل كشف الحساب بالكامل. أعد المحاولة.");
    } finally { setLoading(false); }
  }

  const filteredTraders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return traders;
    return traders.filter((trader) =>
      [trader.name, trader.phone ?? "", trader.address ?? "", trader.notes ?? ""].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [search, traders]);

  const selectedTrader = traders.find((trader) => trader.id === selectedTraderId) ?? null;
  const allTraderTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.trader_id === selectedTraderId),
    [transactions, selectedTraderId],
  );

  const traderTransactions = useMemo(
    () =>
      allTraderTransactions.filter((transaction) => {
        const date = new Date(transaction.created_at);
        if (dateFrom && date < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && date > new Date(`${dateTo}T23:59:59`)) return false;
        return true;
      }),
    [allTraderTransactions, dateFrom, dateTo],
  );

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const stats = useMemo(() => buildStats(traderTransactions), [traderTransactions]);
  const allTimeStats = useMemo(() => buildStats(allTraderTransactions), [allTraderTransactions]);

  const selectTrader = (id: string) => {
    setSelectedTraderId(id);
    setDateFrom("");
    setDateTo("");
  };

  const exportCurrentCustomerPdf = async () => {
    if (!selectedTrader || loading || exporting || error) return;
    setExporting(true);
    const customer = selectedTrader.name;
    const items = [...traderTransactions];
    try {
      const documentIds = [...new Set(items.map(item => item.document_id).filter((id): id is string => Boolean(id)))];
      const documents: StatementDocument[] = [];
      for (let offset = 0; offset < documentIds.length; offset += 100) {
        const { data, error: documentError } = await supabase.from("documents")
          .select("id,company_name,company_name_project,driver_name,vehicle_number,cargo_typedetails")
          .in("id", documentIds.slice(offset, offset + 100));
        if (documentError) throw documentError;
        documents.push(...(data ?? []));
      }
      await downloadCustomerStatement({ customer, items, documents, from: dateFrom, to: dateTo });
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "تعذر إنشاء كشف الحساب. حاول مجدداً.");
    } finally { setExporting(false); }
  };

  return (
    <>
      <style>{`
        .reports-page{--surface:#fff;--surface2:#f8fafc;--text:#17233f;--muted:#667085;--line:#d9dfeb;--accent:#c9a14a;--blue:#2563eb;--shadow:0 16px 38px rgba(15,23,42,.1);width:min(100%,1180px);margin:0 auto;padding:24px 14px 110px;color:var(--text)!important}
        html[data-ghadeer-theme="dark"] .reports-page{--surface:#071a3b;--surface2:#061c40;--text:#fff;--muted:rgba(255,255,255,.66);--line:rgba(35,143,247,.34);--accent:#f0c55f;--blue:#168cff;--shadow:0 20px 44px rgba(2,6,23,.54)}
        .reports-hero{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:26px;border:1px solid var(--line);border-radius:24px;background:var(--surface)!important;box-shadow:var(--shadow)}
        .reports-hero h1{margin:0 0 8px;font-size:2rem}.reports-hero p{margin:0;color:var(--muted)}
        .reports-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(201,161,74,.12);color:var(--accent);font-weight:800;border:1px solid rgba(201,161,74,.25)}
        .reports-layout{display:grid;grid-template-columns:310px minmax(0,1fr);gap:18px;margin-top:18px}.reports-panel{border:1px solid var(--line);border-radius:21px;background:var(--surface)!important;box-shadow:var(--shadow)}
        .reports-sidebar{padding:16px}.reports-panel-title{display:flex;align-items:center;gap:10px;margin:0 0 14px;font-size:1.05rem}.reports-search{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface2);margin-bottom:12px}.reports-search input{border:none;background:transparent;width:100%;outline:none;color:var(--text);font:inherit}.trader-list{display:grid;gap:10px;max-height:640px;overflow:auto;padding-inline-end:4px}.trader-item{width:100%;border:1px solid var(--line);border-radius:14px;padding:12px 10px;background:var(--surface2);text-align:right;color:var(--text);cursor:pointer;transition:.2s ease}.trader-item:hover{border-color:var(--accent);transform:translateY(-1px)}.trader-item.active{background:linear-gradient(135deg, rgba(201,161,74,.12), rgba(37,99,235,.06));border-color:rgba(201,161,74,.5)}.trader-name{font-weight:800}.trader-meta{color:var(--muted);font-size:.78rem}.reports-main{display:grid;gap:18px;min-width:0}.customer-summary{padding:20px}.customer-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:16px}.customer-head h2{margin:0 0 6px}.customer-meta{display:flex;flex-wrap:wrap;gap:8px 14px;color:var(--muted);font-size:.88rem}.customer-actions{display:flex;gap:8px;flex-wrap:wrap}.pill{display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);cursor:pointer;color:var(--text);font-weight:700}.report-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.report-stat{padding:17px;border:1px solid var(--line);border-radius:18px;background:var(--surface)!important}.report-stat.green{background:linear-gradient(145deg, rgba(22,163,74,.09), rgba(255,255,255,0));border-color:rgba(22,163,74,.28)}.report-stat.red{background:linear-gradient(145deg, rgba(239,68,68,.08), rgba(255,255,255,0));border-color:rgba(239,68,68,.22)}.report-stat.blue{background:linear-gradient(145deg, rgba(37,99,235,.08), rgba(255,255,255,0));border-color:rgba(37,99,235,.22)}.report-stat.gold{background:linear-gradient(145deg, rgba(201,161,74,.12), rgba(255,255,255,0));border-color:rgba(201,161,74,.25)}.report-stat-top{display:flex;align-items:center;justify-content:space-between}.report-stat label{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:.75rem}.report-stat strong{display:block;margin-top:12px;font-size:1.45rem}.report-stat small{color:var(--muted)}.account-overview{padding:18px 20px}.account-overview h3{margin:0 0 14px}.overview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.overview-item{padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--surface2)}.overview-item span{display:block;color:var(--muted);font-size:.76rem;margin-bottom:4px}.overview-item strong{font-size:1.1rem}.transactions-panel{overflow:hidden}.transactions-title{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid var(--line)}.transactions-title h3{margin:0}.transactions-table-wrap{overflow:auto}.transactions-table{width:100%;border-collapse:collapse;min-width:680px}.transactions-table th,.transactions-table td{padding:11px 10px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}.transactions-table thead th{background:var(--surface2);font-size:.82rem;color:var(--muted)}.transactions-table tbody tr:hover{background:rgba(201,161,74,.04)}.transactions-table .positive{color:#16a34a;font-weight:700}.transactions-table .negative{color:#dc2626;font-weight:700}.report-empty{padding:32px 18px;text-align:center;color:var(--muted)}.filters{display:flex;gap:10px;flex-wrap:wrap;padding:14px 20px;border-bottom:1px solid var(--line)}.filters input{padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface2);color:var(--text);min-width:150px}.report-error{margin:12px 0 0;padding:12px;border-radius:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.18);color:#b91c1c}.ltr{direction:ltr;unicode-bidi:plaintext}.muted{color:var(--muted)}
        @media(max-width:900px){.reports-layout{grid-template-columns:1fr}.trader-list{max-height:300px}.report-stats,.overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.reports-hero{padding:18px 16px;flex-direction:column;align-items:flex-start}.report-stats,.overview-grid{grid-template-columns:1fr}.customer-head{flex-direction:column}.customer-actions{width:100%}.pill{flex:1;justify-content:center}}
      `}</style>

      <div className="reports-page" dir="rtl">
        <section className="reports-hero">
          <div>
            <div className="reports-badge"><Gauge size={16} /> تقارير العملاء والحسابات</div>
            <h1>كشف الحساب</h1>
            <p>اختر العميل لعرض الحساب التفصيلي الكامل، مع إمكانية طباعة نسخة PDF مباشرة.</p>
          </div>
          <Link to="/customers" search={{ view: "trash" }} className="pill">سلة محذوفات العملاء</Link>
          <button type="button" className="pill" onClick={() => void loadReportData()}>
            <RefreshCcw size={16} /> تحديث
          </button>
        </section>

        {error ? <div className="report-error">{error}</div> : null}

        <div className="reports-layout">
          <aside className="reports-panel reports-sidebar">
            <h2 className="reports-panel-title"><Users size={20} /> العملاء</h2>
            <div className="reports-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث عن اسم أو هاتف أو عنوان"
                aria-label="بحث عن عميل"
              />
            </div>

            <div className="trader-list">
              {filteredTraders.length === 0 ? (
                <div className="report-empty">لا توجد نتائج مطابقة.</div>
              ) : (
                filteredTraders.map((trader) => (
                  <button
                    key={trader.id}
                    type="button"
                    className={`trader-item ${selectedTraderId === trader.id ? "active" : ""}`}
                    onClick={() => selectTrader(trader.id)}
                  >
                    <div className="trader-name">{trader.name}</div>
                    <div className="trader-meta">
                      {trader.phone ? `${trader.phone} • ` : ""}
                      {trader.address ?? "بدون عنوان"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="reports-main">
            {loading ? (
              <div className="reports-panel report-empty">جارٍ تحميل البيانات...</div>
            ) : !selectedTrader ? (
              <div className="reports-panel report-empty">لم يتم اختيار أي عميل.</div>
            ) : (
              <>
                <section className="reports-panel customer-summary">
                  <div className="customer-head">
                    <div>
                      <h2>{selectedTrader.name}</h2>
                      <div className="customer-meta">
                        <span><Phone size={14} /> {selectedTrader.phone ?? "بدون هاتف"}</span>
                        <span><UserRound size={14} /> {selectedTrader.address ?? "بدون عنوان"}</span>
                      </div>
                    </div>

                    <div className="customer-actions">
                      <button type="button" className="pill" disabled={exporting || loading || Boolean(error)} onClick={() => void exportCurrentCustomerPdf()}>
                        <FileText size={16} /> {exporting ? "جارٍ إنشاء الكشف..." : "تنزيل كشف PDF بالدولار"}
                      </button>
                    </div>
                  </div>

                  <div className="filters">
                    <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    <button type="button" className="pill" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                      <Filter size={15} /> إلغاء التصفية
                    </button>
                  </div>
                </section>

                <section className="report-stats">
                  <Stat cls="green" label="إجمالي المستحقات" icon={<ArrowDownLeft size={18} />} value={formatAmount(stats.incoming)} note={`${formatInteger(stats.incomingCount)} حركة`} />
                  <Stat cls="red" label="إجمالي التنزيلات" icon={<ArrowUpRight size={18} />} value={formatAmount(stats.outgoing)} note={`${formatInteger(stats.outgoingCount)} حركة`} />
                  <Stat cls="blue" label="الرصيد الحالي" icon={<WalletCards size={18} />} value={formatAmount(stats.balance)} note={hasDateFilter ? "حسب النطاق المختار" : "إجمالي كامل"} />
                  <Stat cls="gold" label="المتوسط" icon={<TrendingUp size={18} />} value={formatAmount(stats.average)} note={`من ${stats.documents ?? 0} مستند`} />
                </section>

                <section className="reports-panel account-overview">
                  <h3>ملخص الحساب الكلي</h3>
                  <div className="overview-grid">
                    <Overview label="إجمالي المستحقات" value={formatAmount(allTimeStats.incoming)} />
                    <Overview label="إجمالي التنزيلات" value={formatAmount(allTimeStats.outgoing)} />
                    <Overview label="الرصيد النهائي" value={formatAmount(allTimeStats.balance)} />
                    <Overview label="أول حركة" value={allTimeStats.firstDate ? formatDate(allTimeStats.firstDate) : "—"} />
                  </div>
                </section>

                <section className="reports-panel transactions-panel">
                  <div className="transactions-title">
                    <h3>تفاصيل الحركات</h3>
                    <span className="muted">
                      {formatInteger(traderTransactions.length)} حركة
                      {hasDateFilter ? " في النطاق المحدد" : " في كل الفترات"}
                    </span>
                  </div>

                  <div className="transactions-table-wrap">
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>التاريخ</th>
                          <th>النوع</th>
                          <th>رقم المستند</th>
                          <th>الوصف</th>
                          <th>المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traderTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="report-empty">لا توجد حركات للعميل في هذا النطاق.</td>
                          </tr>
                        ) : (
                          traderTransactions
                            .slice()
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((transaction) => {
                              const incoming = isIncoming(transaction.type);
                              return (
                                <tr key={transaction.id}>
                                  <td>{formatDateTime(transaction.created_at)}</td>
                                  <td>{humanizeType(transaction.type)}</td>
                                  <td>{transaction.document_number ?? "—"}</td>
                                  <td>{transaction.cargo_typedetails ?? collectionDescription(transaction.description)}</td>
                                  <td className={incoming ? "positive" : "negative"}>
                                    {incoming ? "+" : "-"}
                                    {formatAmount(transaction.amount)}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function buildStats(items: Transaction[]): ReportStats {
  let incoming = 0;
  let outgoing = 0;
  let incomingCount = 0;
  let outgoingCount = 0;
  const documents = new Set<string>();

  for (const item of items) {
    const amountValue = Math.abs(Number(item.amount) || 0);
    const isIncomingItem = isIncoming(item.type);
    if (isIncomingItem) {
      incoming += amountValue;
      incomingCount += 1;
    } else {
      outgoing += amountValue;
      outgoingCount += 1;
    }

    if (item.document_number) documents.add(item.document_number);
  }

  const balance = customerBalance(items);
  const average = items.length ? balance / items.length : 0;
  const firstDate = items.length ? items[items.length - 1]?.created_at ?? null : null;
  const lastDate = items.length ? items[0]?.created_at ?? null : null;

  return { incoming, outgoing, balance, count: items.length, incomingCount, outgoingCount, documents: documents.size, average, firstDate, lastDate };
}

function Stat({ cls = "", label, icon, value, note }: { cls?: string; label: string; icon: ReactNode; value: string; note?: string }) {
  return (
    <div className={`report-stat ${cls}`}>
      <div className="report-stat-top">
        <label>{icon}{label}</label>
      </div>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function Overview({ label, value }: { label: string; value: string }) {
  return (
    <div className="overview-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function humanizeType(type: string) {
  return isIncoming(type) ? "مستحق على العميل" : "تنزيل من الحساب";
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value || 0);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
