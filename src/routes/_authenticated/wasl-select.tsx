import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, FilePlus2, MapPin, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wasl-select")({
  validateSearch: (search: Record<string, unknown>): { kind?: "income" } => ({
    kind: search.kind === "income" ? "income" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "إنشاء وصل جديد | شركة الغدير" },
      { name: "description", content: "اختر وصل قبض من عميل أو وصل دخل للحمولات العراقية والتركية." },
    ],
  }),
  component: WaslSelectPage,
});

function WaslSelectPage() {
  const { kind } = Route.useSearch();
  const income = kind === "income";
  return (
    <div className="receipt-selector-page" dir="rtl">
      <style>{`
        .receipt-selector-page{max-width:960px;margin:auto;padding:36px 16px 110px;color:var(--foreground)}
        .receipt-selector-heading{margin-bottom:26px}.receipt-selector-kicker{color:var(--gh-gold-dark,var(--primary));font-weight:800;font-size:.85rem}
        .receipt-selector-heading h1{font-size:clamp(1.7rem,4vw,2.4rem);margin:10px 0}.receipt-selector-heading p{color:var(--muted-foreground);line-height:1.8}
        .receipt-selector-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
        .receipt-type-card{--receipt-accent:#e5b750;display:flex;flex-direction:column;gap:24px;padding:28px;border:1px solid var(--receipt-accent);border-radius:24px;background:linear-gradient(145deg,#24211b,#11151d);color:#fff!important;text-decoration:none;box-shadow:0 16px 35px #0002;transition:transform .18s,box-shadow .18s}
        .receipt-type-card--income{--receipt-accent:#ff9e49;background:linear-gradient(145deg,#28201b,#121925)}
        .receipt-type-card:hover{transform:translateY(-3px);box-shadow:0 20px 40px #0003}.receipt-type-card:focus-visible,.receipt-selector-back:focus-visible{outline:3px solid var(--receipt-accent,#e5b750);outline-offset:5px}
        .receipt-type-icon{display:grid;place-items:center;width:62px;height:62px;border:1px solid var(--receipt-accent);border-radius:18px;color:var(--receipt-accent)}.receipt-type-icon svg{width:30px;height:30px}
        .receipt-type-copy strong{display:block;font-size:1.65rem;color:#fff!important}.receipt-type-copy small{display:block;margin-top:12px;color:#d8dde5!important;font-size:.95rem;line-height:1.9}
        .receipt-type-action{margin-top:auto;padding-top:18px;border-top:1px solid #ffffff25;color:var(--receipt-accent);font-weight:800}
        .receipt-selector-back{display:inline-flex;align-items:center;gap:8px;margin-bottom:22px;padding:10px 14px;border:1px solid var(--border);border-radius:12px;color:var(--foreground);text-decoration:none}
        @media(max-width:600px){.receipt-selector-grid{grid-template-columns:1fr}.receipt-type-card{padding:24px;gap:18px}.receipt-selector-page{padding-top:24px}}
        @media(prefers-reduced-motion:reduce){.receipt-type-card{transition:none}.receipt-type-card:hover{transform:none}}
      `}</style>
      {income && <Link to="/wasl-select" search={{}} className="receipt-selector-back"><ArrowRight size={18} /> الرجوع إلى نوع الوصل</Link>}
      <div className="receipt-selector-heading">
        <span className="receipt-selector-kicker">إنشاء وصل جديد</span>
        <h1>{income ? "وصل دخل — اختر نوع الحمولة" : "اختر نوع الوصل"}</h1>
        <p>{income ? "اختر الحمولة لإدخال تفاصيل الوصل وتسجيل المستحق على العميل." : "اختر وصل قبض لتسجيل دفعة من العميل، أو وصل دخل لتسجيل حمولة جديدة."}</p>
      </div>
      <div className="receipt-selector-grid">
        {income ? <>
          <Link to="/wasl" className="receipt-type-card">
            <span className="receipt-type-icon" aria-hidden="true"><MapPin /></span>
            <span className="receipt-type-copy"><strong>حمولات عراقية</strong><small>إنشاء وصل الحمولة العراقية وحفظ بياناتها على حساب العميل.</small></span>
            <span className="receipt-type-action">فتح الوصل العراقي</span>
          </Link>
          <Link to="/turkish-loads" className="receipt-type-card receipt-type-card--income">
            <span className="receipt-type-icon" aria-hidden="true"><Truck /></span>
            <span className="receipt-type-copy"><strong>حمولات تركية</strong><small>إنشاء وصل الحمولة التركية مع بيانات السائق والعميل والمبلغ المستحق.</small></span>
            <span className="receipt-type-action">فتح الوصل التركي</span>
          </Link>
        </> : <>
          <Link to="/collections" className="receipt-type-card">
            <span className="receipt-type-icon" aria-hidden="true"><Banknote /></span>
            <span className="receipt-type-copy"><strong>وصل قبض</strong><small>تسجيل مبلغ مقبوض من العميل وخصمه من الرصيد المستحق عليه في كشف الحساب.</small></span>
            <span className="receipt-type-action">إنشاء وصل قبض</span>
          </Link>
          <Link to="/wasl-select" search={{ kind: "income" }} className="receipt-type-card receipt-type-card--income">
            <span className="receipt-type-icon" aria-hidden="true"><FilePlus2 /></span>
            <span className="receipt-type-copy"><strong>وصل دخل</strong><small>تسجيل حمولة عراقية أو تركية وإضافة مبلغها إلى المستحق على العميل.</small></span>
            <span className="receipt-type-action">إنشاء وصل دخل</span>
          </Link>
        </>}
      </div>
    </div>
  );
}
