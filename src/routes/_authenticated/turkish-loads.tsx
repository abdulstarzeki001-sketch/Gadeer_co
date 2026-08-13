import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TurkishLoadForm = {
  driverName: string;
  cargoType: string;
  customerName: string;
  unitAmount: string;
  loadCount: string;
};

type TurkishLoadReceipt = {
  id: string;
  document_number: string | null;
  driver_name: string | null;
  amount: number;
  description: string | null;
  created_at: string;
};

type ReceiptDetails = {
  customerName?: string;
  cargoType?: string;
  unitAmount?: number;
  loadCount?: number;
};

const EMPTY: TurkishLoadForm = {
  driverName: "",
  cargoType: "",
  customerName: "",
  unitAmount: "",
  loadCount: "1",
};

export const Route = createFileRoute("/_authenticated/turkish-loads")({
  head: () => ({
    meta: [
      { title: "حمولات تركية | شركة الغدير" },
      {
        name: "description",
        content: "إدارة وصولات الحمولات التركية وحساب المستحقات وحفظها في النظام.",
      },
    ],
  }),
  component: TurkishLoadsPage,
});

function parseDetails(value: string | null): ReceiptDetails {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as ReceiptDetails;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-IQ", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function TurkishLoadsPage() {
  const [form, setForm] = useState<TurkishLoadForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [receipts, setReceipts] = useState<TurkishLoadReceipt[]>([]);

  const unitAmount = Number(form.unitAmount || 0);
  const loadCount = Math.max(0, Number.parseInt(form.loadCount || "0", 10) || 0);
  const amountDue = unitAmount * loadCount;

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, document_number, driver_name, amount, description, created_at")
      .eq("type", "turkish_load_receipt")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error) setReceipts((data ?? []) as TurkishLoadReceipt[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReceipts();
  }, [loadReceipts]);

  const totals = useMemo(() => {
    return receipts.reduce(
      (acc, receipt) => {
        const details = parseDetails(receipt.description);
        acc.amount += Number(receipt.amount || 0);
        acc.loads += Number(details.loadCount || 0);
        return acc;
      },
      { amount: 0, loads: 0 },
    );
  }, [receipts]);

  const set = (key: keyof TurkishLoadForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!form.driverName.trim() || !form.cargoType.trim() || !form.customerName.trim()) {
      setMessage({ text: "أكمل اسم السائق ونوع الحمل واسم العميل/الشركة.", ok: false });
      return;
    }
    if (unitAmount <= 0 || loadCount <= 0) {
      setMessage({ text: "المبلغ وعدد الحمولات يجب أن يكونا أكبر من صفر.", ok: false });
      return;
    }

    setBusy(true);
    try {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("company_name", "حمولات تركية")
        .maybeSingle();

      if (companyError || !company) throw companyError ?? new Error("تعذر العثور على سجل الحمولات التركية");

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("انتهت جلسة الدخول");

      const receiptNumber = `TR-${Date.now()}`;
      const description = JSON.stringify({
        customerName: form.customerName.trim(),
        cargoType: form.cargoType.trim(),
        unitAmount,
        loadCount,
      });

      const { error } = await supabase.from("transactions").insert({
        company_id: company.id,
        document_number: receiptNumber,
        driver_name: form.driverName.trim(),
        type: "turkish_load_receipt",
        amount: amountDue,
        description,
        created_by: userData.user.id,
      });

      if (error) throw error;

      setForm(EMPTY);
      setMessage({ text: `تم حفظ الوصل بنجاح — المستحق ${formatMoney(amountDue)}`, ok: true });
      await loadReceipts();
    } catch (error) {
      console.error(error);
      setMessage({
        text: error instanceof Error ? error.message : "تعذر حفظ الوصل. حاول مرة أخرى.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem 1rem 5rem", maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            background: "#fff7ed",
            color: "#9a3412",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          🇹🇷 النوع الثاني من الوصولات
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(1.7rem, 5vw, 2.35rem)" }}>وصولات الحمولات التركية</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8, lineHeight: 1.8 }}>
          سجل الحمولات التركية بسرعة، واحسب المستحق تلقائيًا حسب مبلغ الحمولة الواحدة وعدد الحمولات.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <SummaryCard label="عدد الوصولات الأخيرة" value={String(receipts.length)} />
        <SummaryCard label="إجمالي الحمولات" value={String(totals.loads)} />
        <SummaryCard label="إجمالي المستحق" value={formatMoney(totals.amount)} strong />
      </div>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          background: "#fff",
          padding: "clamp(16px, 4vw, 24px)",
          boxShadow: "0 8px 28px rgba(15, 23, 42, 0.06)",
          marginBottom: 22,
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>إضافة وصل تركي جديد</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            الحقول مرتبة للعمل السريع من الهاتف، والمستحق يظهر قبل الحفظ.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <Field label="اسم السائق">
              <input
                required
                value={form.driverName}
                onChange={(event) => set("driverName", event.target.value)}
                placeholder="مثال: أحمد محمد"
              />
            </Field>

            <Field label="نوع الحمل">
              <input
                required
                value={form.cargoType}
                onChange={(event) => set("cargoType", event.target.value)}
                placeholder="مثال: مواد غذائية / حديد / أثاث"
              />
            </Field>

            <Field label="اسم العميل أو الشركة">
              <input
                required
                value={form.customerName}
                onChange={(event) => set("customerName", event.target.value)}
                placeholder="اسم العميل أو الشركة"
              />
            </Field>

            <Field label="مبلغ الحمولة الواحدة">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.unitAmount}
                onChange={(event) => set("unitAmount", event.target.value)}
                placeholder="0"
              />
            </Field>

            <Field label="عدد الحمولات">
              <input
                required
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.loadCount}
                onChange={(event) => set("loadCount", event.target.value)}
              />
            </Field>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: "16px 18px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #fff7ed, #fff)",
              border: "1px solid #fed7aa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#9a3412", fontWeight: 700 }}>المبلغ المستحق</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#7c2d12", marginTop: 2 }}>
                {formatMoney(amountDue)}
              </div>
            </div>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {formatMoney(unitAmount)} × {loadCount} حمولة
            </div>
          </div>

          {message && (
            <div
              style={{
                marginTop: 14,
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${message.ok ? "#86efac" : "#fecaca"}`,
                background: message.ok ? "#f0fdf4" : "#fef2f2",
                color: message.ok ? "#166534" : "#991b1b",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "13px 18px",
              border: 0,
              borderRadius: 12,
              background: "#990707",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "جارٍ حفظ الوصل..." : "حفظ الوصل التركي"}
          </button>
        </form>
      </section>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>آخر الوصولات التركية</h2>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>جارٍ تحميل السجلات...</div>
        ) : receipts.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
            لا توجد وصولات تركية محفوظة بعد.
          </div>
        ) : (
          <div style={{ display: "grid" }}>
            {receipts.map((receipt) => {
              const details = parseDetails(receipt.description);
              return (
                <article
                  key={receipt.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 14,
                    padding: "15px 18px",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: "#111827" }}>
                      {receipt.driver_name || "بدون اسم"} • {details.cargoType || "حمولة تركية"}
                    </div>
                    <div style={{ marginTop: 5, color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>
                      {details.customerName || "—"} • {details.loadCount || 0} حمولة • رقم {receipt.document_number || "—"}
                    </div>
                    <div style={{ marginTop: 3, color: "#94a3b8", fontSize: 12 }}>
                      {new Date(receipt.created_at).toLocaleString("ar-IQ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>المستحق</div>
                    <strong style={{ fontSize: 17, color: "#990707" }}>{formatMoney(Number(receipt.amount))}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 900, color: strong ? "#990707" : "#111827" }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#334155", fontWeight: 700 }}>
      <span>{label}</span>
      <div
        style={{
          display: "grid",
        }}
      >
        {children}
      </div>
    </label>
  );
}
