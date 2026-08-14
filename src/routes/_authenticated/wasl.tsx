import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import companiesJson from "@/data/companies.json";
import { generateDocumentPdf, fileToDataUrl, downloadBlob, type WaslForm } from "@/lib/wasl-pdf";
import { supabase } from "@/integrations/supabase/client";

type RefCompany = {
  Number: number;
  Brand: string;
  CompanyNameProject: string;
  GovernorateName: string;
  GrantingLicenseApproval?: string;
  LicenseApprovalDate?: string;
  LicenseApprovalNumber?: number | string;
  LicenseTextSpecialization?: string;
  TypeIndustryProduction?: string;
  Unit?: string;
};

type Trader = {
  id: string;
  name: string;
  phone: string | null;
};

const COMPANIES = (companiesJson as RefCompany[]).filter((c) => c.CompanyNameProject);

const PROVINCES = [
  "بغداد",
  "نينوى",
  "البصرة",
  "ذي قار",
  "الأنبار",
  "النجف",
  "كربلاء",
  "بابل",
  "ديالى",
  "ميسان",
  "واسط",
  "صلاح الدين",
  "أربيل",
  "دهوك",
  "السليمانية",
  "كركوك",
  "المثنى",
  "القادسية",
];
const ENTRY_POINTS = ["سيطرة دارمان", "سيطرة جيمن", "سيطرة السد", "سيطرة باوه محمود"];

function normalizeDate(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "none") return "";
  const parts = s.split(/[-/]/).map((p) => p.trim());
  if (parts.length !== 3) return "";
  let y: string, m: string, d: string;
  if (parts[0].length === 4) {
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else if (parts[2].length === 4) {
    d = parts[0];
    m = parts[1];
    y = parts[2];
  } else return "";
  const yi = +y,
    mi = +m,
    di = +d;
  if (!yi || !mi || !di) return "";
  if (yi < 1900 || yi > 2100 || mi < 1 || mi > 12 || di < 1 || di > 31) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${yi}-${pad(mi)}-${pad(di)}`;
}

const EMPTY: WaslForm = {
  docNumber: "",
  docDate: "",
  docTime: "",
  entryPoint: "",
  driverName: "",
  vehicleNumber: "",
  vehicleProvince: "",
  weight: "",
  destination: "",
  companyName: "",
  provinceName: "",
  trademark: "",
  cargoType: "",
  licenseAuthority: "",
  licenseNumber: "",
  licenseDate: "",
  licenseDescription: "",
  licensedProducts: "",
};

export const Route = createFileRoute("/_authenticated/wasl")({
  head: () => ({
    meta: [
      { title: "إنشاء الوثيقة المؤقتة - منصة المنتج المحلي" },
      {
        name: "description",
        content: "نموذج إصدار الوثيقة المؤقتة لبيانات الحمولة وتحميلها كملف PDF.",
      },
    ],
  }),
  component: WaslPage,
});

function WaslPage() {
  const [form, setForm] = useState<WaslForm>(EMPTY);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [traderId, setTraderId] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [systemCompanyId, setSystemCompanyId] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof WaslForm>(k: K, v: WaslForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: RefCompany[] = [];
    for (let i = 0; i < COMPANIES.length && out.length < 20; i++) {
      const c = COMPANIES[i];
      const num = String(c.Number ?? "");
      const name = (c.CompanyNameProject || "").toLowerCase();
      const brand = (c.Brand || "").toLowerCase();
      const lic = String(c.LicenseApprovalNumber ?? "");
      if (num.includes(q) || name.includes(q) || brand.includes(q) || lic.includes(q)) out.push(c);
    }
    return out;
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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
    return () => {
      cancelled = true;
    };
  }, []);

  const pick = (c: RefCompany) => {
    setForm((p) => ({
      ...p,
      companyName: c.CompanyNameProject || "",
      trademark: c.Brand || "",
      provinceName: c.GovernorateName || "",
      licenseNumber: c.LicenseApprovalNumber != null ? String(c.LicenseApprovalNumber) : "",
      licenseAuthority: c.GrantingLicenseApproval || "",
      licenseDate: normalizeDate(c.LicenseApprovalDate),
      licenseDescription: c.LicenseTextSpecialization || "",
      cargoType: c.LicenseTextSpecialization || "",
      licensedProducts: c.TypeIndustryProduction || "",
    }));
    setQuery(`${c.Number} - ${c.CompanyNameProject}`);
    setOpen(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(dueAmount);
    const selectedTrader = traders.find((trader) => trader.id === traderId);

    if (!traderId || !selectedTrader) {
      setStatus({ msg: "اختر اسم العميل للوصلة", ok: false });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus({ msg: "أدخل مبلغ المستحق بشكل صحيح", ok: false });
      return;
    }
    if (!qrFile) {
      setStatus({ msg: "لازم ترفع صورة QR Code", ok: false });
      return;
    }
    if (!systemCompanyId) {
      setStatus({ msg: "تعذر تحديد حساب الشركة. أعد تحميل الصفحة وحاول مرة أخرى.", ok: false });
      return;
    }

    setBusy(true);
    setStatus({ msg: "جاري إنشاء وحفظ الوصلة...", ok: true });
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("تعذر التحقق من المستخدم الحالي");

      const qrDataUrl = await fileToDataUrl(qrFile);
      const blob = await generateDocumentPdf(form, qrDataUrl);

      const { data: documentRow, error: documentError } = await supabase
        .from("documents")
        .insert({
          document_number: form.docNumber,
          company_id: systemCompanyId,
          company_name: form.companyName,
          company_name_project: form.companyName,
          driver_name: form.driverName,
          vehicle_number: form.vehicleNumber,
          checkpoint_name_control: form.entryPoint,
          registration_governorate: form.vehicleProvince,
          cargo_typedetails: form.cargoType,
          weight_quantity: form.weight,
          destination_governorate: form.destination,
          governorate_name: form.provinceName,
          granting_license_approval: form.licenseAuthority,
          license_approval_number: form.licenseNumber,
          license_approval_date: form.licenseDate,
          license_text_specialization: form.licenseDescription,
          brand: form.trademark,
          type_industry_production: form.licensedProducts,
          qr_code_data: qrDataUrl,
          document_value: amount,
          trader_id: traderId,
          created_by: authData.user.id,
          notes: `العميل: ${selectedTrader.name}`,
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
        description: `مستحق وصلة عراقية - ${selectedTrader.name}`,
        created_by: authData.user.id,
      });

      if (transactionError) {
        await supabase.from("documents").delete().eq("id", documentRow.id);
        throw transactionError;
      }

      const filename = `وثيقة-${form.docNumber || Date.now()}.pdf`;
      downloadBlob(blob, filename);
      setStatus({
        msg: `تم إنشاء الوصلة وحفظ مستحق ${amount.toLocaleString("ar-IQ")} على حساب ${selectedTrader.name} ✓`,
        ok: true,
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "فشل إنشاء أو حفظ الوصلة";
      setStatus({ msg: `فشل إنشاء أو حفظ الوصلة: ${message}`, ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wasl-page" style={{ padding: "1.6rem 1rem 3rem", maxWidth: 880, margin: "0 auto" }}>
      <h1>إصدار الوثيقة المؤقتة</h1>
      <p style={{ textAlign: "center", color: "var(--gh-muted)", marginTop: "-1rem", marginBottom: "1.6rem" }}>
        جمهورية العراق – الهيئة العامة للكمارك • منصة المنتج المحلي
      </p>
      <div className="add-form">
        <form onSubmit={onSubmit}>
          <Section title="حساب العميل">
            <Field label="اسم العميل">
              <select required value={traderId} onChange={(e) => setTraderId(e.target.value)}>
                <option value="">-- اختر العميل --</option>
                {traders.map((trader) => (
                  <option key={trader.id} value={trader.id}>
                    {trader.name}{trader.phone ? ` - ${trader.phone}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="مبلغ المستحق على العميل">
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                value={dueAmount}
                onChange={(e) => setDueAmount(e.target.value)}
                placeholder="0"
              />
            </Field>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--gh-muted)" }}>
              عند إنشاء الوصلة سيضاف هذا المبلغ تلقائيًا إلى حساب العميل في التقارير.
            </p>
          </Section>

          <Section title="معلومات الوثيقة">
            <Field label="رقم الوثيقة">
              <input required value={form.docNumber} onChange={(e) => set("docNumber", e.target.value)} />
            </Field>
            <Field label="تاريخ إنشاء الوثيقة">
              <input type="date" required value={form.docDate} onChange={(e) => set("docDate", e.target.value)} />
            </Field>
            <Field label="التوقيت">
              <input type="time" required value={form.docTime} onChange={(e) => set("docTime", e.target.value)} />
            </Field>
          </Section>

          <Section title="المعلومات الشخصية">
            <Field label="نقطة السيطرة">
              <select required value={form.entryPoint} onChange={(e) => set("entryPoint", e.target.value)}>
                <option value="">-- اختر --</option>
                {ENTRY_POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="اسم السائق">
              <input required value={form.driverName} onChange={(e) => set("driverName", e.target.value)} />
            </Field>
            <Field label="رقم العجلة">
              <input required value={form.vehicleNumber} onChange={(e) => set("vehicleNumber", e.target.value)} />
            </Field>
            <Field label="محافظة تسجيل العجلة">
              <ProvinceSelect value={form.vehicleProvince} onChange={(v) => set("vehicleProvince", v)} />
            </Field>
            <Field label="الوزن / الكمية (طن)">
              <input required value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </Field>
            <Field label="محافظة الوجهة النهائية">
              <ProvinceSelect value={form.destination} onChange={(v) => set("destination", v)} />
            </Field>

            <div ref={wrapRef} style={{ position: "relative", marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "var(--gh-muted)", display: "block", marginBottom: 5 }}>
                بحث عن الشركة (بالرقم أو الاسم أو العلامة التجارية)
              </label>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder={`ابحث ضمن ${COMPANIES.length} شركة...`}
                style={inputStyle}
              />
              {open && query.trim() && (
                <div style={resultsStyle}>
                  {matches.length === 0 ? (
                    <div style={{ padding: "9px 12px", fontSize: 13, color: "#888" }}>لا توجد نتائج</div>
                  ) : matches.map((c) => (
                    <div
                      key={c.Number}
                      onClick={() => pick(c)}
                      style={rowStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <span style={{ color: "#990707", fontWeight: 700, marginLeft: 8 }}>#{c.Number}</span>
                      <span style={{ fontWeight: 600 }}>{c.CompanyNameProject}</span>
                      {c.Brand && <span style={{ color: "#888", marginRight: 8 }}>— {c.Brand}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Field label="اسم الشركة / المشروع">
              <input required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="نوع / تفاصيل الحمولة">
              <input required value={form.cargoType} onChange={(e) => set("cargoType", e.target.value)} />
            </Field>
            <Field label="اسم المحافظة">
              <ProvinceSelect value={form.provinceName} onChange={(v) => set("provinceName", v)} />
            </Field>
          </Section>

          <Section title="معلومات الإجازة والترخيص">
            <Field label="الجهة المانحة للإجازة / الموافقة">
              <input required value={form.licenseAuthority} onChange={(e) => set("licenseAuthority", e.target.value)} />
            </Field>
            <Field label="رقم الإجازة / الموافقة">
              <input required value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
            </Field>
            <Field label="تاريخ الإجازة / الموافقة">
              <input type="date" required value={form.licenseDate} onChange={(e) => set("licenseDate", e.target.value)} />
            </Field>
            <Field label="منطوق الإجازة / الاختصاص">
              <input required value={form.licenseDescription} onChange={(e) => set("licenseDescription", e.target.value)} />
            </Field>
            <Field label="العلامة التجارية">
              <textarea required rows={3} value={form.trademark} onChange={(e) => set("trademark", e.target.value)} />
            </Field>
            <Field label="المواد / المنتجات المرخصة">
              <input required value={form.licensedProducts} onChange={(e) => set("licensedProducts", e.target.value)} />
            </Field>
          </Section>

          <Section title="رمز الاستجابة السريعة (QR Code)">
            <Field label="قم برفع صورة QR Code (مطلوب)">
              <input type="file" accept="image/*" required onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
            </Field>
          </Section>

          {status && (
            <div style={{ margin: "16px 0", padding: "12px 16px", borderRadius: 8, fontSize: 14, border: `1px solid ${status.ok ? "#2e7d32" : "#c62828"}`, background: status.ok ? "#e8f5e9" : "#ffebee", color: status.ok ? "#155724" : "#721c24" }}>
              {status.msg}
            </div>
          )}

          <button type="submit" disabled={busy} style={{ marginTop: 16, padding: "12px 24px", border: "none", borderRadius: 10, background: busy ? "#ccc" : "#990707", color: "#fff", fontSize: 15, cursor: busy ? "not-allowed" : "pointer", width: "100%", fontFamily: "inherit" }}>
            {busy ? "جاري الإنشاء والحفظ..." : "إنشاء الوثيقة وحفظ المستحق"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
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
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  maxHeight: 280,
  overflowY: "auto",
  marginTop: 4,
  boxShadow: "0 6px 18px rgba(0,0,0,.12)",
};
const rowStyle: React.CSSProperties = {
  padding: "9px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 13,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid var(--gh-line, #e5e7eb)", borderRadius: 10, padding: 16, marginTop: 14 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--gh-text, #111827)" }}>{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
      <label style={{ fontSize: 13, color: "var(--gh-text, #374151)" }}>{label}</label>
      {children}
    </div>
  );
}

function ProvinceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select required value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">-- اختر --</option>
      {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );
}
