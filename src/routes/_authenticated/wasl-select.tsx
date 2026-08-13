import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wasl-select")({
  head: () => ({
    meta: [
      { title: "اختيار نوع الوصل | شركة الغدير" },
      {
        name: "description",
        content: "اختيار نوع الحمولة بين الحمولات العراقية والحمولات التركية.",
      },
    ],
  }),
  component: WaslSelectPage,
});

function WaslSelectPage() {
  return (
    <div className="receipt-selector-page">
      <div className="receipt-selector-heading">
        <span className="receipt-selector-kicker">إنشاء وصل جديد</span>
        <h1>اختر نوع الحمولة</h1>
        <p>اختر نوع العملية للمتابعة إلى النموذج المناسب.</p>
      </div>

      <div className="receipt-selector-grid">
        <Link to="/wasl" className="receipt-type-card receipt-type-card--iraq">
          <span className="receipt-type-icon" aria-hidden="true">
            <MapPin strokeWidth={2.1} />
          </span>
          <span className="receipt-type-copy">
            <strong>حمولات عراقية</strong>
            <small>الوصل المحلي الحالي مع تفاصيل الوثيقة والحمولة وبيانات الشركة.</small>
          </span>
          <span className="receipt-type-action">فتح الوصل العراقي</span>
        </Link>

        <Link to="/turkish-loads" className="receipt-type-card receipt-type-card--turkey">
          <span className="receipt-type-icon" aria-hidden="true">
            <Truck strokeWidth={2.1} />
          </span>
          <span className="receipt-type-copy">
            <strong>حمولات تركية</strong>
            <small>اسم السائق، نوع الحمل، العميل أو الشركة، المبلغ، العدد والمبلغ المستحق.</small>
          </span>
          <span className="receipt-type-action">فتح الوصل التركي</span>
        </Link>
      </div>
    </div>
  );
}
