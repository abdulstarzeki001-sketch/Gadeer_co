import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, Send, Eye, ChevronsUpDown, Check, Search, X, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import companiesJson from "@/data/companies.json";

export const Route = createFileRoute("/_authenticated/documents/new")({
  head: () => ({ meta: [{ title: "إنشاء وثيقة - الكمارك" }] }),
  component: CreateDocument,
});

type RefCompany = { Number: number; Brand: string; CompanyNameProject: string; GovernorateName: string };
const REFERENCE = (companiesJson as RefCompany[]).filter((r) => r.CompanyNameProject);

function CreateDocument() {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refIndex, setRefIndex] = useState<number | null>(null);
  const [refQuery, setRefQuery] = useState("");
  const PAGE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const filteredRefs = useMemo(() => {
    const q = refQuery.trim().toLowerCase();
    if (!q) return REFERENCE;
    const tokens = q.split(/\s+/).filter(Boolean);
    return REFERENCE.filter((r) => {
      const hay = `${r.CompanyNameProject ?? ""} ${r.Brand ?? ""} ${r.GovernorateName ?? ""}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [refQuery]);

  // reset pagination on query change or reopen
  useEffect(() => {
    setVisibleCount(PAGE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [refQuery, pickerOpen]);

  // infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!pickerOpen) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE, filteredRefs.length));
        }
      },
      { root, rootMargin: "200px" }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [pickerOpen, filteredRefs.length]);

  // الشركات المضافة يدوياً (شركات النقل - العملاء)
  const { data: clients = [] } = useQuery({
    queryKey: ["client-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies").select("id, company_name").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: traders = [] } = useQuery({
    queryKey: ["traders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("traders").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    company_id: "",
    trader_id: "",
    document_value: "",
    brand: "",
    company_name_project: "",
    governorate_name: "",
    ref_number: "",
    document_number: "326727",
    document_date: "2026-02-25",
    document_time: "10:11",
    checkpoint_name_control: "سيطرة دارمان",
    driver_name: "",
    vehicle_number: "",
    registration_governorate: "",
    cargo_typedetails: "",
    weight_quantity: "",
    destination_governorate: "بغداد",
    granting_license_approval: "",
    license_approval_number: "",
    license_approval_date: "",
    license_text_specialization: "",
    item_name: "",
    item_qty: "",
  });

  const selectedRef = refIndex != null ? REFERENCE[refIndex] : null;

  const pickReference = (idx: number) => {
    const r = REFERENCE[idx];
    setRefIndex(idx);
    setPickerOpen(false);
    setForm((f) => ({
      ...f,
      company_name_project: r.CompanyNameProject,
      governorate_name: r.GovernorateName ?? "",
      brand: r.Brand ?? "",
      ref_number: r.Number ? String(r.Number) : "",
    }));
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.company_id) throw new Error("اختر شركة النقل");
      if (!selectedRef) throw new Error("اختر شركة مرجعية لتعبئة هيكل الوثيقة");

      const client = clients.find((c) => c.id === form.company_id);
      if (!client) throw new Error("شركة النقل غير موجودة");

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("الجلسة غير صالحة");

      const insertPayload = {
        company_id: form.company_id,
        company_name: client.company_name,
        company_name_project: form.company_name_project || null,
        brand: form.brand || null,
        governorate_name: form.governorate_name || null,
        document_value: parseFloat(form.document_value) || 0,
        trader_id: form.trader_id || null,
        created_by: uid,
      };
      const { data: doc, error } = await supabase.from("documents").insert(insertPayload).select().single();
      if (error) throw error;

      const verifyUrl = `${window.location.origin}/verify/${doc.document_number}`;
      const qr = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
      await supabase.from("documents").update({ qr_code_data: qr }).eq("id", doc.id);

      const val = parseFloat(form.document_value);
      if (val > 0) {
        await supabase.from("transactions").insert({
          company_id: form.company_id,
          trader_id: form.trader_id || null,
          document_id: doc.id,
          document_number: doc.document_number,
          type: "charge",
          amount: val,
          description: `وثيقة شحن - ${client.company_name}`,
          created_by: uid,
        });
      }
      return doc;
    },
    onSuccess: (doc) => {
      toast.success(`تم إنشاء الوثيقة ${doc.document_number}`);
      navigate({ to: "/documents/$id", params: { id: doc.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openPreview = () => {
    const client = clients.find((c) => c.id === form.company_id);
    sessionStorage.setItem("document-preview", JSON.stringify({
      ...form,
      company_name: client?.company_name ?? "",
    }));
    window.open("/documents/preview", "_blank");
  };

  const refCount = useMemo(() => REFERENCE.length, []);

  const [qrUpload, setQrUpload] = useState<string | null>(null);
  const onQrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setQrUpload(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">إنشاء وثيقة جديدة</h1>
        <p className="text-sm text-muted-foreground">منصة المنتج المحلي - وثيقة شحن</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />معلومات الشركة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>اختر شركة مرجعية (لتعبئة هيكل الوثيقة) — {refCount} شركة *</Label>
            <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal" onClick={() => setPickerOpen(true)}>
              <span className="truncate">{selectedRef ? selectedRef.CompanyNameProject : "ابحث عن شركة..."}</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
              <DialogContent dir="rtl" className="p-0 gap-0 w-[92vw] max-w-sm h-[80vh] max-h-[640px] flex flex-col overflow-hidden">
                <DialogHeader className="p-3 border-b shrink-0">
                  <DialogTitle className="text-sm">اختر شركة مرجعية</DialogTitle>
                </DialogHeader>
                <div className="p-2 border-b shrink-0 space-y-2">
                  <div className="relative">
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={refQuery}
                      onChange={(e) => setRefQuery(e.target.value)}
                      placeholder="ابحث بالاسم أو العلامة أو المحافظة..."
                      className="pr-8 pl-8"
                    />
                    {refQuery && (
                      <button
                        type="button"
                        onClick={() => setRefQuery("")}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="تصفير البحث"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground px-1">
                    {filteredRefs.length} نتيجة — يعرض {Math.min(visibleCount, filteredRefs.length)}
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                  {filteredRefs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
                  ) : (
                    <>
                      {filteredRefs.slice(0, visibleCount).map((r) => {
                        const i = REFERENCE.indexOf(r);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => pickReference(i)}
                            className="w-full flex items-start gap-2 text-right p-2 hover:bg-accent border-b last:border-b-0"
                          >
                            <Check className={`h-4 w-4 mt-0.5 shrink-0 ${refIndex === i ? "opacity-100" : "opacity-0"}`} />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm truncate">{r.CompanyNameProject}</span>
                              <span className="text-xs text-muted-foreground truncate">{r.GovernorateName} — {r.Brand}</span>
                            </div>
                          </button>
                        );
                      })}
                      {visibleCount < filteredRefs.length && (
                        <div ref={sentinelRef} className="p-3 text-center text-xs text-muted-foreground">
                          جاري التحميل...
                        </div>
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {selectedRef && (
              <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                <div className="text-xs text-muted-foreground">
                  تم تعبئة الخانات التالية تلقائياً — يمكنك تعديلها
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم الوثيقة</Label>
                    <Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">تاريخ الوثيقة</Label>
                    <Input type="date" value={form.document_date} onChange={(e) => setForm({ ...form, document_date: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">وقت الوثيقة</Label>
                    <Input type="time" value={form.document_time} onChange={(e) => setForm({ ...form, document_time: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم سيطرة الدخول</Label>
                    <Input value={form.checkpoint_name_control} onChange={(e) => setForm({ ...form, checkpoint_name_control: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">اسم السائق</Label>
                    <Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} placeholder="عبدالله محمد عبدالله" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم العجلة</Label>
                    <Input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">محافظة تسجيل العجلة</Label>
                    <Input value={form.registration_governorate} onChange={(e) => setForm({ ...form, registration_governorate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">نوع / تفاصيل الحمولة</Label>
                    <Input value={form.cargo_typedetails} onChange={(e) => setForm({ ...form, cargo_typedetails: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الوزن / الكمية</Label>
                    <Input value={form.weight_quantity} onChange={(e) => setForm({ ...form, weight_quantity: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الوجهة النهائية / المحافظة</Label>
                    <Input value={form.destination_governorate} onChange={(e) => setForm({ ...form, destination_governorate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم المحافظة</Label>
                    <Input value={form.governorate_name} onChange={(e) => setForm({ ...form, governorate_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم التسجيل</Label>
                    <Input value={form.ref_number} onChange={(e) => setForm({ ...form, ref_number: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">اسم الشركة / المشروع</Label>
                    <Input value={form.company_name_project} onChange={(e) => setForm({ ...form, company_name_project: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">الجهة المانحة للإجازة / الموافقة</Label>
                    <Input value={form.granting_license_approval} onChange={(e) => setForm({ ...form, granting_license_approval: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم الإجازة / الموافقة</Label>
                    <Input value={form.license_approval_number} onChange={(e) => setForm({ ...form, license_approval_number: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">تاريخ الإجازة / الموافقة</Label>
                    <Input type="date" value={form.license_approval_date} onChange={(e) => setForm({ ...form, license_approval_date: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">منطوق الإجازة / الاختصاص</Label>
                    <Input value={form.license_text_specialization} onChange={(e) => setForm({ ...form, license_text_specialization: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">العلامة التجارية</Label>
                    <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم المنتج</Label>
                    <Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الكمية والوحدة</Label>
                    <Input value={form.item_qty} onChange={(e) => setForm({ ...form, item_qty: e.target.value })} placeholder="7 طن" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>شركة النقل (المضافة يدوياً) *</Label>
            <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
              <SelectTrigger><SelectValue placeholder={clients.length === 0 ? "أضف شركة نقل من صفحة الشركات أولاً" : "اختر شركة النقل"} /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>التاجر (اختياري - لربط الوثيقة بحساب تاجر)</Label>
            <Select value={form.trader_id || "__none"} onValueChange={(v) => setForm({ ...form, trader_id: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder={traders.length === 0 ? "أضف تاجراً من صفحة التجار" : "اختر التاجر"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— بدون تاجر —</SelectItem>
                {traders.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-accent" />قيمة الوثيقة ($)</Label>
            <Input type="number" min="0" step="0.01" value={form.document_value} onChange={(e) => setForm({ ...form, document_value: e.target.value })} dir="ltr" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button type="button" variant="outline" size="lg" onClick={openPreview} disabled={!selectedRef || !form.company_id}>
          <Eye className="h-4 w-4 ml-2" />
          معاينة الوثيقة
        </Button>
        <Button type="submit" size="lg" disabled={createMut.isPending}>
          <Send className="h-4 w-4 ml-2" />
          {createMut.isPending ? "جاري الإنشاء..." : "إنشاء الوثيقة و رمز QR"}
        </Button>
      </div>
    </form>
  );
}
