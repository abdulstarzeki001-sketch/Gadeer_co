import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Filter,
  Phone,
  RefreshCcw,
  Search,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "تقارير العملاء | لوحة التحكم" },
      {
        name: "description",
        content: "تقارير مالية تفصيلية لكل عميل مع ملخص الحساب وجميع الحركات المرتبطة به.",
      },
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
  driver_name: string | null;
  created_at: string;
};

function ReportsPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTraderId, setSelectedTraderId] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadReportData();
  }, []);

  async function loadReportData() {
    setLoading(true);
    setError(null);

    const [{ data: tradersData, error: tradersError }, { data: transactionsData, error: transactionsError }] =
      await Promise.all([
        supabase.from("traders").select("id,name,phone,address,notes,created_at").order("name"),
        supabase
          .from("transactions")
          .select(
            "id,trader_id,company_id,document_id,document_number,amount,type,description,cargo_typedetails,driver_name,created_at",
          )
          .order("created_at", { ascending: false }),
      ]);

    if (tradersError || transactionsError) {
      setError(tradersError?.message || transactionsError?.message || "تعذر تحميل بيانات التقارير.");
      setLoading(false);
      return;
    }

    const nextTraders = (tradersData ?? []) as Trader[];
    setTraders(nextTraders);
    setTransactions((transactionsData ?? []) as Transaction[]);
    setSelectedTraderId((current) => current || nextTraders[0]?.id || "");
    setLoading(false);
  }

  const filteredTraders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return traders;
    return traders.filter((trader) =>
      [trader.name, trader.phone ?? "", trader.address ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, traders]);

  const selectedTrader = traders.find((trader) => trader.id === selectedTraderId) ?? null;

  const traderTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (transaction.trader_id !== selectedTraderId) return false;
      const createdAt = new Date(transaction.created_at);
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (createdAt < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (createdAt > to) return false;
      }
      return true;
    });
  }, [dateFrom, dateTo, selectedTraderId, transactions]);

  const totals = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;

    for (const transaction of traderTransactions) {
      const amount = Number(transaction.amount) || 0;
      if (isIncoming(transaction.type)) incoming += amount;
      else outgoing += amount;
    }

    return {
      incoming,
      outgoing,
      balance: incoming - outgoing,
      count: traderTransactions.length,
    };
  }, [traderTransactions]);

  return (
    <>
      <style>{`
        .reports-dark-page { display:none; }
        html[data-ghadeer-theme="dark"] .reports-legacy-page { display:none !important; }
        html[data-ghadeer-theme="dark"] .reports-dark-page { display:block; }
        html[data-ghadeer-theme="dark"] .reports-shell {
          width:min(100%,1180px); margin:0 auto; padding:22px 14px 110px; color:#fff;
        }
        html[data-ghadeer-theme="dark"] .reports-hero {
          position:relative; overflow:hidden; display:flex; justify-content:space-between; gap:18px; align-items:center;
          padding:26px; border:1px solid rgba(31,145,255,.4); border-radius:24px;
          background:radial-gradient(circle at 12% 20%,rgba(22,140,255,.22),transparent 28%),linear-gradient(145deg,#071f47,#03152f);
          box-shadow:0 22px 55px rgba(0,0,0,.24),inset 0 0 40px rgba(15,115,230,.05);
        }
        html[data-ghadeer-theme="dark"] .reports-hero::after {
          content:""; position:absolute; inset:auto -40px -70px auto; width:220px; height:220px; border-radius:50%;
          border:1px solid rgba(240,197,95,.18); box-shadow:0 0 70px rgba(22,140,255,.16);
        }
        html[data-ghadeer-theme="dark"] .reports-hero h1 { margin:0 0 7px; font-size:clamp(1.55rem,5vw,2.35rem); color:#fff!important; }
        html[data-ghadeer-theme="dark"] .reports-hero p { margin:0; color:rgba(255,255,255,.72)!important; line-height:1.8; }
        html[data-ghadeer-theme="dark"] .reports-hero-badge {
          flex:0 0 auto; width:76px; height:76px; display:grid; place-items:center; border-radius:22px;
          color:#f0c55f; border:1px solid rgba(240,197,95,.42); background:linear-gradient(145deg,#0a2f66,#051a3d);
          box-shadow:0 0 30px rgba(22,140,255,.2);
        }
        html[data-ghadeer-theme="dark"] .reports-layout { display:grid; grid-template-columns:310px minmax(0,1fr); gap:18px; margin-top:18px; }
        html[data-ghadeer-theme="dark"] .reports-panel {
          border:1px solid rgba(35,143,247,.34); border-radius:21px; background:linear-gradient(145deg,rgba(7,28,63,.96),rgba(4,20,47,.96));
          box-shadow:0 18px 42px rgba(0,0,0,.18); color:#fff!important;
        }
        html[data-ghadeer-theme="dark"] .reports-sidebar { padding:18px; align-self:start; position:sticky; top:94px; }
        html[data-ghadeer-theme="dark"] .reports-panel-title { display:flex; align-items:center; gap:10px; margin:0 0 14px; color:#fff!important; font-size:1.05rem; }
        html[data-ghadeer-theme="dark"] .reports-search { position:relative; margin-bottom:13px; }
        html[data-ghadeer-theme="dark"] .reports-search svg { position:absolute; right:13px; top:50%; transform:translateY(-50%); color:#91a4c7; }
        html[data-ghadeer-theme="dark"] .reports-search input {
          width:100%; margin:0!important; padding:11px 42px 11px 12px!important; border:1px solid rgba(35,143,247,.32)!important;
          border-radius:14px!important; background:#061c40!important; color:#fff!important;
        }
        html[data-ghadeer-theme="dark"] .trader-list { display:grid; gap:8px; max-height:520px; overflow:auto; padding-inline-end:3px; }
        html[data-ghadeer-theme="dark"] .trader-button {
          width:100%; text-align:right; display:grid; grid-template-columns:42px 1fr; gap:10px; align-items:center; padding:11px;
          border:1px solid transparent!important; border-radius:15px!important; background:rgba(255,255,255,.025)!important; color:#fff!important; cursor:pointer;
        }
        html[data-ghadeer-theme="dark"] .trader-button:hover { border-color:rgba(31,145,255,.34)!important; background:rgba(22,140,255,.08)!important; }
        html[data-ghadeer-theme="dark"] .trader-button.active { border-color:rgba(240,197,95,.52)!important; background:linear-gradient(145deg,rgba(240,197,95,.12),rgba(22,140,255,.08))!important; }
        html[data-ghadeer-theme="dark"] .trader-avatar { width:42px; height:42px; display:grid; place-items:center; border-radius:14px; background:#0a326c; color:#f0c55f; }
        html[data-ghadeer-theme="dark"] .trader-copy strong, html[data-ghadeer-theme="dark"] .trader-copy small { display:block; color:#fff!important; }
        html[data-ghadeer-theme="dark"] .trader-copy small { opacity:.58; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        html[data-ghadeer-theme="dark"] .reports-main { display:grid; gap:18px; min-width:0; }
        html[data-ghadeer-theme="dark"] .customer-summary { padding:20px; }
        html[data-ghadeer-theme="dark"] .customer-head { display:flex; justify-content:space-between; align-items:flex-start; gap:15px; margin-bottom:16px; }
        html[data-ghadeer-theme="dark"] .customer-head h2 { margin:0; color:#fff!important; font-size:1.35rem; }
        html[data-ghadeer-theme="dark"] .customer-meta { display:flex; gap:12px; flex-wrap:wrap; margin-top:7px; }
        html[data-ghadeer-theme="dark"] .customer-meta span { display:inline-flex; align-items:center; gap:6px; color:rgba(255,255,255,.64)!important; font-size:.88rem; }
        html[data-ghadeer-theme="dark"] .refresh-report {
          display:inline-flex; align-items:center; gap:7px; padding:9px 12px; border:1px solid rgba(31,145,255,.42)!important;
          border-radius:12px!important; background:#082650!important; color:#fff!important; cursor:pointer;
        }
        html[data-ghadeer-theme="dark"] .report-filters { display:grid; grid-template-columns:1fr 1fr auto; gap:10px; align-items:end; padding-top:14px; border-top:1px solid rgba(255,255,255,.07); }
        html[data-ghadeer-theme="dark"] .report-filter label { display:block; margin-bottom:6px; color:#fff!important; font-size:.82rem; font-weight:800; }
        html[data-ghadeer-theme="dark"] .report-filter input {
          width:100%; margin:0!important; padding:10px 12px!important; border:1px solid rgba(31,145,255,.32)!important; border-radius:12px!important;
          background:#061c40!important; color:#fff!important;
        }
        html[data-ghadeer-theme="dark"] .clear-filter { min-height:43px; padding:8px 13px; border-radius:12px!important; border:1px solid rgba(240,197,95,.34)!important; background:rgba(240,197,95,.08)!important; color:#fff!important; cursor:pointer; }
        html[data-ghadeer-theme="dark"] .report-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
        html[data-ghadeer-theme="dark"] .report-stat {
          padding:17px; border:1px solid rgba(31,145,255,.28); border-radius:18px; background:linear-gradient(145deg,rgba(8,37,80,.92),rgba(4,22,51,.96));
        }
        html[data-ghadeer-theme="dark"] .report-stat-top { display:flex; justify-content:space-between; align-items:center; gap:8px; color:rgba(255,255,255,.68)!important; font-size:.82rem; }
        html[data-ghadeer-theme="dark"] .report-stat-icon { width:36px; height:36px; display:grid; place-items:center; border-radius:12px; background:rgba(22,140,255,.11); color:#fff; }
        html[data-ghadeer-theme="dark"] .report-stat.gold .report-stat-icon { color:#f0c55f; background:rgba(240,197,95,.1); }
        html[data-ghadeer-theme="dark"] .report-stat.green .report-stat-icon { color:#39e59a; background:rgba(57,229,154,.1); }
        html[data-ghadeer-theme="dark"] .report-stat.red .report-stat-icon { color:#ff8181; background:rgba(255,85,85,.1); }
        html[data-ghadeer-theme="dark"] .report-stat strong { display:block; margin-top:12px; color:#fff!important; font-size:clamp(1.08rem,3vw,1.45rem); direction:ltr; text-align:right; }
        html[data-ghadeer-theme="dark"] .transactions-panel { overflow:hidden; }
        html[data-ghadeer-theme="dark"] .transactions-title { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid rgba(255,255,255,.07); }
        html[data-ghadeer-theme="dark"] .transactions-title h3 { margin:0; color:#fff!important; }
        html[data-ghadeer-theme="dark"] .transactions-title span { color:rgba(255,255,255,.56)!important; font-size:.86rem; }
        html[data-ghadeer-theme="dark"] .transactions-table-wrap { overflow:auto; }
        html[data-ghadeer-theme="dark"] .report-table { width:100%; min-width:760px; border-collapse:collapse; background:transparent!important; }
        html[data-ghadeer-theme="dark"] .report-table th { padding:12px 14px; text-align:right; color:#f0c55f!important; background:#061b3d!important; border-bottom:1px solid rgba(31,145,255,.18)!important; white-space:nowrap; }
        html[data-ghadeer-theme="dark"] .report-table td { padding:13px 14px; color:#fff!important; border-bottom:1px solid rgba(255,255,255,.055)!important; vertical-align:middle; }
        html[data-ghadeer-theme="dark"] .report-table tr:last-child td { border-bottom:0!important; }
        html[data-ghadeer-theme="dark"] .type-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:999px; font-weight:800; font-size:.78rem; }
        html[data-ghadeer-theme="dark"] .type-badge.in { color:#71f0b1!important; background:rgba(48,214,137,.1); border:1px solid rgba(48,214,137,.2); }
        html[data-ghadeer-theme="dark"] .type-badge.out { color:#ff9a9a!important; background:rgba(255,91,91,.09); border:1px solid rgba(255,91,91,.2); }
        html[data-ghadeer-theme="dark"] .amount-in { color:#75efb5!important; font-weight:900; direction:ltr; }
        html[data-ghadeer-theme="dark"] .amount-out { color:#ffaaaa!important; font-weight:900; direction:ltr; }
        html[data-ghadeer-theme="dark"] .empty-report { padding:46px 20px; text-align:center; color:rgba(255,255,255,.64)!important; }
        html[data-ghadeer-theme="dark"] .empty-report svg { margin:0 auto 12px; color:#5f86b8; }
        html[data-ghadeer-theme="dark"] .report-error { margin-top:16px; padding:13px 16px; border-radius:14px; color:#ffdada!important; border:1px solid rgba(255,95,95,.3); background:rgba(255,70,70,.08); }
        @media(max-width:900px){
          html[data-ghadeer-theme="dark"] .reports-layout { grid-template-columns:1fr; }
          html[data-ghadeer-theme="dark"] .reports-sidebar { position:static; }
          html[data-ghadeer-theme="dark"] .trader-list { grid-template-columns:repeat(2,minmax(0,1fr)); max-height:300px; }
          html[data-ghadeer-theme="dark"] .report-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media(max-width:600px){
          html[data-ghadeer-theme="dark"] .reports-shell { padding-inline:12px; }
          html[data-ghadeer-theme="dark"] .reports-hero { padding:21px 18px; }
          html[data-ghadeer-theme="dark"] .reports-hero-badge { width:62px; height:62px; border-radius:18px; }
          html[data-ghadeer-theme="dark"] .trader-list { grid-template-columns:1fr; }
          html[data-ghadeer-theme="dark"] .customer-head { flex-direction:column; }
          html[data-ghadeer-theme="dark"] .report-filters { grid-template-columns:1fr 1fr; }
          html[data-ghadeer-theme="dark"] .clear-filter { grid-column:1/-1; }
          html[data-ghadeer-theme="dark"] .report-stats { gap:9px; }
          html[data-ghadeer-theme="dark"] .report-stat { padding:14px 12px; }
        }
      `}</style>

      <div className="reports-dark-page">
        <div className="reports-shell">
          <section className="reports-hero">
            <div>
              <h1>تقارير العملاء والحسابات</h1>
              <p>اختر أي عميل وشاهد كامل حركاته المالية، الرصيد المحسوب، والمستندات المرتبطة به في مكان واحد.</p>
            </div>
            <div className="reports-hero-badge" aria-hidden="true">
              <TrendingUp size={36} strokeWidth={1.8} />
            </div>
          </section>

          {error ? <div className="report-error">{error}</div> : null}

          <div className="reports-layout">
            <aside className="reports-panel reports-sidebar">
              <h2 className="reports-panel-title"><Users size={20} /> العملاء</h2>
              <div className="reports-search">
                <Search size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم العميل أو الهاتف" />
              </div>

              <div className="trader-list">
                {loading ? (
                  <div className="empty-report">جارٍ تحميل العملاء...</div>
                ) : filteredTraders.length === 0 ? (
                  <div className="empty-report">لا يوجد عملاء مطابقون.</div>
                ) : (
                  filteredTraders.map((trader) => (
                    <button
                      key={trader.id}
                      type="button"
                      className={`trader-button${selectedTraderId === trader.id ? " active" : ""}`}
                      onClick={() => setSelectedTraderId(trader.id)}
                    >
                      <span className="trader-avatar"><UserRound size={21} /></span>
                      <span className="trader-copy">
                        <strong>{trader.name}</strong>
                        <small>{trader.phone || trader.address || "بدون تفاصيل إضافية"}</small>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <main className="reports-main">
              <section className="reports-panel customer-summary">
                {selectedTrader ? (
                  <>
                    <div className="customer-head">
                      <div>
                        <h2>{selectedTrader.name}</h2>
                        <div className="customer-meta">
                          {selectedTrader.phone ? <span><Phone size={15} /> {selectedTrader.phone}</span> : null}
                          {selectedTrader.address ? <span><UserRound size={15} /> {selectedTrader.address}</span> : null}
                          <span><CalendarDays size={15} /> منذ {formatDate(selectedTrader.created_at)}</span>
                        </div>
                      </div>
                      <button type="button" className="refresh-report" onClick={() => void loadReportData()}>
                        <RefreshCcw size={16} /> تحديث
                      </button>
                    </div>

                    <div className="report-filters">
                      <div className="report-filter">
                        <label htmlFor="report-from">من تاريخ</label>
                        <input id="report-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                      </div>
                      <div className="report-filter">
                        <label htmlFor="report-to">إلى تاريخ</label>
                        <input id="report-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                      </div>
                      <button type="button" className="clear-filter" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                        <Filter size={15} /> عرض الكل
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-report">اختر عميلًا لعرض تفاصيل حسابه.</div>
                )}
              </section>

              <section className="report-stats">
                <div className="report-stat green">
                  <div className="report-stat-top"><span>إجمالي الداخل</span><span className="report-stat-icon"><ArrowDownLeft size={18} /></span></div>
                  <strong>{formatAmount(totals.incoming)}</strong>
                </div>
                <div className="report-stat red">
                  <div className="report-stat-top"><span>إجمالي الخارج</span><span className="report-stat-icon"><ArrowUpRight size={18} /></span></div>
                  <strong>{formatAmount(totals.outgoing)}</strong>
                </div>
                <div className="report-stat gold">
                  <div className="report-stat-top"><span>الرصيد المحسوب</span><span className="report-stat-icon"><WalletCards size={18} /></span></div>
                  <strong>{formatAmount(totals.balance)}</strong>
                </div>
                <div className="report-stat">
                  <div className="report-stat-top"><span>عدد الحركات</span><span className="report-stat-icon"><FileText size={18} /></span></div>
                  <strong>{totals.count.toLocaleString("ar-IQ")}</strong>
                </div>
              </section>

              <section className="reports-panel transactions-panel">
                <div className="transactions-title">
                  <h3>تفاصيل حساب العميل</h3>
                  <span>{traderTransactions.length} حركة</span>
                </div>

                {loading ? (
                  <div className="empty-report">جارٍ تحميل الحركات...</div>
                ) : !selectedTrader ? (
                  <div className="empty-report"><UserRound size={34} />اختر عميلًا من القائمة لعرض حسابه.</div>
                ) : traderTransactions.length === 0 ? (
                  <div className="empty-report"><FileText size={34} />لا توجد حركات لهذا العميل ضمن الفترة المحددة.</div>
                ) : (
                  <div className="transactions-table-wrap">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>التاريخ</th>
                          <th>رقم الوثيقة</th>
                          <th>نوع الحركة</th>
                          <th>التفاصيل</th>
                          <th>السائق / الحمولة</th>
                          <th>المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traderTransactions.map((transaction) => {
                          const incoming = isIncoming(transaction.type);
                          return (
                            <tr key={transaction.id}>
                              <td>{formatDateTime(transaction.created_at)}</td>
                              <td>{transaction.document_number || "—"}</td>
                              <td>
                                <span className={`type-badge ${incoming ? "in" : "out"}`}>
                                  {incoming ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                  {humanizeType(transaction.type)}
                                </span>
                              </td>
                              <td>{transaction.description || "—"}</td>
                              <td>{[transaction.driver_name, transaction.cargo_typedetails].filter(Boolean).join(" • ") || "—"}</td>
                              <td className={incoming ? "amount-in" : "amount-out"}>
                                {incoming ? "+" : "-"}{formatAmount(Math.abs(Number(transaction.amount) || 0))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>

      <div className="reports-legacy-page" style={{ padding: "1.5rem 1rem 3rem", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>التقارير</h1>
          <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.7 }}>
            صفحة التقارير تعرض ملخص العمليات، الوصلات، وسلوك الحسابات ضمن النظام.
          </p>
        </div>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, background: "#fff" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>لوحة مؤشرات التشغيل</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            راجع مؤشرات أداء الحساب، عدد العملاء، الوصلات، والمصروفات في مكان واحد.
          </p>
        </section>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
          <Link
            to="/"
            style={{ display: "inline-flex", padding: "10px 16px", borderRadius: 10, background: "#990707", color: "#fff", textDecoration: "none" }}
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </>
  );
}

function isIncoming(type: string) {
  const normalized = (type || "").trim().toLowerCase();
  return ["credit", "income", "payment", "receipt", "deposit", "قبض", "دائن", "وارد", "ايداع", "إيداع"].some(
    (token) => normalized.includes(token),
  );
}

function humanizeType(type: string) {
  const normalized = (type || "").trim().toLowerCase();
  if (["credit", "income", "payment", "receipt", "deposit"].some((token) => normalized.includes(token))) return "داخل";
  if (["debit", "expense", "withdraw", "payment_out"].some((token) => normalized.includes(token))) return "خارج";
  return type || "حركة";
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 2 }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-IQ", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
