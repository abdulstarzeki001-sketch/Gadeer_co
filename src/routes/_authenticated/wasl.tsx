import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import companiesJson from "@/data/companies.json";
import { downloadBlob } from "@/lib/wasl-pdf";
import { generateLoadReceiptPdf } from "@/lib/load-receipt-pdf";
import { supabase } from "@/integrations/supabase/client";

type RefCompany = {
  Number: number;
  Brand: string;
  CompanyNameProject: string;
  GovernorateName: string;
  LicenseTextSpecialization?: string;
  TypeIndustryProduction?: string;
};

type Trader = {
  id: string;
  name: string;
  phone: string | null;
};

type IraqiLoadForm = {
  entryPoint: string;
  driverName: string;
  vehicleNumber: string;
  vehicleProvince: string;
  weight: string;
  destination: string;
  companyName: string;
  provinceName: string;
  cargoType: string;
  licensedProducts: string;
};

const COMPANIES = (companiesJson as RefCompany[]).filter((company) => company.CompanyNameProject);

const PROVINCES = [
  "بغداد", "نينوى", "البصرة", "ذي قار", "الأنبار", "النجف", "كربلاء", "بابل", "ديالى",
  "ميسان", "واسط", "صلاح الدين", "أربيل", "دهوك", "السليمانية", "كركوك", "المثنى", "القادسية",
];
const ENTRY_POINTS = ["سيطرة دارمان", "سيطرة جيمن", "سيطرة السد", "سيطرة باوه محمود"];

const EMPTY: IraqiLoadForm = {
  entryPoint: "",
  driverName: "",
  vehicleNumber: "",
  vehicleProvince: "",
  weight: "",
  destination: "",
  companyName: "",
  provinceName: "",
  cargoType: "",
  licensedProducts: "",
};

export const Route = createFileRoute("/_authenticated/wasl")({
  head: () => ({
    meta: [
      { title: "وصل حمولة عراقية | شركة الغدير" },
      { name: "description", content: "إنشاء وحفظ وصل حمولة عراقية وربطه مباشرة بحساب العميل." },
    ],
  }),
  component: WaslPage,
});

function WaslPage() {
  const [form, setForm] = useState<IraqiLoadForm>(EMPTY);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [traderId, setTraderId] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [systemCompanyId, setSystemCompanyId] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof IraqiLoadForm>(key: K, value: IraqiLoadForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const matches = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return [];
    const result: RefCompany[] = [];
    for (const company of COMPANIES) {
      if (result.length >= 20) break;
      const number = String(company.Number ?? "");
      const name = (company.CompanyNameProject || "").toLowerCase();
      const brand = (company.Brand || "").toLowerCase();
      if (number.includes(q) || name.includes(q) || brand.includes(q)) result.push(company);
    }
    return result;
  }, [companyQuery]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setCompanyOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      supabase.from("traders").select("id,name,phone").order("name"),
      supabase.from("companies").select("id").limit(1).maybeSingle(),
    ]).then(([tradersResult, companyResult]) => {
      if (cancelled) return;
      if (!tradersResult.error) setTraders((tradersResult.data ?? []) as Trader[]);
      if (!companyResult.error && companyResult.data?.id) setSystemCompanyId(companyResult.data.id);
    });
    return () => { cancelled = true; };
  }, []);

  const pickCompany = (company: RefCompany) => {
    setForm((previous) => ({
      ...previous,
      companyName: company.CompanyNameProject || "",
      provinceName: company.GovernorateName || "",
      cargoType: company.LicenseTextSpecialization || previous.cargoType,
      licensedProducts: company.TypeIndustryProduction || "",
    }));
    setCompanyQuery(`${company.Number} - ${company.CompanyNameProject}`);
    setCompanyOpen(false);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(dueAmount);
    const selectedTrader = traders.find((trader) => trader.id === traderId);

    if (!selectedTrader) {
      setStatus({ msg: "اختر اسم العميل للوصلة.", ok: false });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus({ msg: "أدخل مبلغ المستحق بشكل صحيح.", ok: false });
      return;
    }
    if (!systemCompanyId) {
      setStatus({ msg: "تعذر تحديد حساب الشركة. أعد تحميل الصفحة وحاول مرة أخرى.", ok: false });
      return;
    }

    setBusy(true);
    setStatus({ msg: "جاري حفظ الوصل وإنشاء PDF...", ok: true });

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("تعذر التحقق من المستخدم الحالي");

      const receiptNumber = `IQ-${Date.now()}`;
      const now = new Date();

      const { data: documentRow, error: documentError } = await supabase
        .from("documents")
        .insert({
          document_number: receiptNumber,
          company_id: systemCompanyId,
          company_name: form.companyName || "حمولة عراقية",
          company_name_project: form.companyName || "حمولة عراقية",
          driver_name: form.driverName,
          vehicle_number: form.vehicleNumber,
          checkpoint_name_control: form.entryPoint,
          registration_governorate: form.vehicleProvince,
          cargo_typedetails: form.cargoType,
          weight_quantity: form.weight,
          destination_governorate: form.destination,
          governorate_name: form.provinceName,
          type_industry_production: form.licensedProducts,
          document_value: amount,
          trader_id: traderId,
          created_by: authData.user.id,
          notes: `وصل حمولة عراقية - العميل: ${selectedTrader.name}`,
        })
        .select("id,document_number")
        .single();

      if (documentError) throw documentError;

      const { error: transactionError } = await supabase.from("transactions").insert({
        company_id: systemCompanyId,
        document_id: documentRow.id,
        document_number: documentRow.document_number,
        driver_name: form.driverName,
        trader_id: traderId,
        amount,
        type: "income",
        cargo_typedetails: form.cargoType,
        description: `مستحق وصل حمولة عراقية - ${selectedTrader.name}`,
        created_by: authData.user.id,
      });

      if (transactionError) {
        await supabase.from("documents").delete().eq("id", documentRow.id);
        throw transactionError;
      }

      const pdf = await generateLoadReceiptPdf({
        receiptNumber,
        loadType: "عراقية",
        customerName: selectedTrader.name,
        driverName: form.driverName,
        cargoType: form.cargoType || form.licensedProducts || "حمولة عراقية",
        amount,
        vehicleNumber: form.vehicleNumber,
        destination: form.destination,
        date: now.toLocaleString("en-GB"),
      });

      downloadBlob(pdf, `وصل-حمولة-عراقية-${receiptNumber}.pdf`);
      setStatus({
        msg: `تم حفظ الوصل وتنزيل PDF — المستحق ${amount.toLocaleString("en-US")} على حساب ${selectedTrader.name} ✓`,
        ok: true,
      });
      setForm(EMPTY);
      setTraderId("");
      setDueAmount("");
      setCompanyQuery("");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "فشل حفظ الوصل";
      setStatus({ msg: `فشل حفظ الوصل: ${message}`, ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wasl-page" style={{ padding: "1.4rem .4rem 5rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <span style={{ display: "inline-flex", padding: "7px 12px", borderRadius: 999, border: "1px solid rgba(244,199,93,.35)", color: "var(--gh-gold,#f4c75d)", fontWeight: 800, marginBottom: 9 }}>🇮🇶 وصل حمولة عراقية</span>
        <h1 style={{ margin: 0 }}>إصدار وصل حمولة عراقية</h1>
        <p style={{ color: "var(--gh-muted)", marginTop: 8 }}>اختر العميل وأدخل بيانات الحمولة؛ رقم الوصل والتاريخ يتم إنشاؤهما تلقائيًا.</p>
      </div>

      <div className="add-form">
        <form onSubmit={onSubmit}>
          <Section title="حساب العميل">
            <Field label={`اسم العميل (${traders.length})`}>
              <select required value={traderId} onChange={(event) => setTraderId(event.target.value)}>
                <option value="">-- اختر العميل --</option>
                {traders.map((trader) => (
                  <option key={trader.id} value={trader.id}>
                    {trader.name}{trader.phone ? ` - ${trader.phone}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="مبلغ المستحق على العميل">
              <input type="number" min="0" step="0.01" inputMode="decimal" required value={dueAmount} onChange={(event) => setDueAmount(event.target.value)} placeholder="0" />
            </Field>
          </Section>

          <Section title="بيانات الحمولة">
            <Field label="نقطة السيطرة">
              <select required value={form.entryPoint} onChange={(event) => set("entryPoint", event.target.value)}>
                <option value="">-- اختر --</option>
                {ENTRY_POINTS.map((point) => <option key={point} value={point}>{point}</option>)}
              </select>
            </Field>
            <Field label="اسم السائق"><input required value={form.driverName} onChange={(event) => set("driverName", event.target.value)} /></Field>
            <Field label="رقم العجلة"><input required value={form.vehicleNumber} onChange={(event) => set("vehicleNumber", event.target.value)} /></Field>
            <Field label="محافظة تسجيل العجلة"><ProvinceSelect value={form.vehicleProvince} onChange={(value) => set("vehicleProvince", value)} /></Field>
            <Field label="الوزن / الكمية (طن)"><input required value={form.weight} onChange={(event) => set("weight", event.target.value)} /></Field>
            <Field label="محافظة الوجهة النهائية"><ProvinceSelect value={form.destination} onChange={(value) => set("destination", value)} /></Field>

            <div ref={wrapRef} style={{ position: "relative", marginBottom: 10 }}>
              <label style={{ fontSize: 13, display: "block", marginBottom: 5 }}>الشركة / المشروع</label>
              <input
                value={companyQuery}
                onChange={(event) => { setCompanyQuery(event.target.value); setCompanyOpen(true); }}
                onFocus={() => setCompanyOpen(true)}
                placeholder="ابحث بالرقم أو اسم الشركة"
                style={inputStyle}
              />
              {companyOpen && companyQuery.trim() && (
                <div className="company-results" style={resultsStyle}>
                  {matches.length === 0 ? (
                    <div style={{ padding: "10px 12px", fontSize: 13 }}>لا توجد نتائج</div>
                  ) : matches.map((company) => (
                    <button key={company.Number} type="button" onClick={() => pickCompany(company)} style={rowStyle}>
                      <strong>#{company.Number}</strong>
                      <span>{company.CompanyNameProject}</span>
                      {company.Brand ? <small>{company.Brand}</small> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Field label="اسم الشركة / المشروع"><input required value={form.companyName} onChange={(event) => set("companyName", event.target.value)} /></Field>
            <Field label="نوع / تفاصيل الحمولة"><input required value={form.cargoType} onChange={(event) => set("cargoType", event.target.value)} /></Field>
            <Field label="اسم المحافظة"><ProvinceSelect value={form.provinceName} onChange={(value) => set("provinceName", value)} /></Field>
            <Field label="المواد / المنتجات"><input value={form.licensedProducts} onChange={(event) => set("licensedProducts", event.target.value)} /></Field>
          </Section>

          {status && (
            <div style={{ margin: "16px 0", padding: "12px 14px", borderRadius: 12, fontSize: 14, border: `1px solid ${status.ok ? "rgba(34,197,94,.45)" : "rgba(239,68,68,.45)"}`, background: status.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)", color: status.ok ? "#86efac" : "#fca5a5" }}>
              {status.msg}
            </div>
          )}

          <button type="submit" disabled={busy} style={{ marginTop: 16, padding: "14px 24px", border: "none", borderRadius: 15, width: "100%", fontFamily: "inherit", fontWeight: 900, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "جاري الحفظ وإنشاء PDF..." : "حفظ وتنزيل الوصل PDF"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 9px",
  borderRadius: 12,
  fontSize: 14,
  direction: "rtl",
  fontFamily: "inherit",
};

const resultsStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  left: 0,
  zIndex: 1000,
  borderRadius: 14,
  maxHeight: 280,
  overflowY: "auto",
  marginTop: 5,
};

const rowStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  gap: 8,
  alignItems: "center",
  padding: "10px 12px",
  cursor: "pointer",
  border: 0,
  borderBottom: "1px solid rgba(47,151,255,.16)",
  background: "transparent",
  color: "inherit",
  textAlign: "right",
  fontFamily: "inherit",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid var(--gh-line,#e5e7eb)", borderRadius: 18, padding: 16, marginTop: 14 }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 11 }}>
      <label style={{ fontSize: 13, fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

function ProvinceSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select required value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">-- اختر --</option>
      {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
    </select>
  );
}
