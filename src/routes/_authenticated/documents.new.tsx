import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Truck, Shield, DollarSign, Send } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentTemplate } from "@/components/document-template";

export const Route = createFileRoute("/_authenticated/documents/new")({
  head: () => ({ meta: [{ title: "إنشاء وثيقة - الكمارك" }] }),
  component: CreateDocument,
});

const CHECKPOINTS = ["سيطرة دارمان", "سيطرة السد"];
const GOVERNORATES = ["بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "كركوك", "النجف", "كربلاء", "ذي قار", "بابل", "ديالى", "الأنبار", "واسط", "صلاح الدين", "ميسان", "المثنى", "القادسية", "دهوك"];

function CreateDocument() {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQr, setPreviewQr] = useState<string>("");
  const { data: companies = [] } = useQuery({
    queryKey: ["companies-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, company_name, governorate, license_number, specialization, brand").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    company_id: "", company_name: "", company_name_project: "", subject: "",
    driver_name: "", vehicle_number: "", licence_number: "",
    checkpoint_name_control: "", registration_governorate: "",
    cargo_typedetails: "", weight_quantity: "",
    destination_governorate: "", governorate_name: "",
    x_coordinate: "", y_coordinate: "",
    granting_license_approval: "", license_approval_number: "", license_approval_date: "", license_text_specialization: "",
    brand: "", notes: "", document_value: "",
  });
  const onCompanyChange = (id: string) => {
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    setForm((f) => ({
      ...f,
      company_id: id,
      company_name: c.company_name,
      company_name_project: c.company_name,
      governorate_name: c.governorate,
      license_approval_number: c.license_number,
      license_text_specialization: c.specialization,
      brand: c.brand ?? "",
    }));
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.company_id || !form.driver_name || !form.vehicle_number || !form.checkpoint_name_control || !form.weight_quantity) {
        throw new Error("الرجاء ملء الحقول المطلوبة *");
      }

      const insertPayload = {
        company_id: form.company_id,
        company_name: form.company_name,
        company_name_project: form.company_name_project || null,
        subject: form.subject || null,
        driver_name: form.driver_name,
        vehicle_number: form.vehicle_number,
        licence_number: form.license_approval_number || form.licence_number || null,
        checkpoint_name_control: form.checkpoint_name_control,
        registration_governorate: form.registration_governorate || null,
        cargo_typedetails: form.cargo_typedetails || null,
        weight_quantity: form.weight_quantity,
        destination_governorate: form.destination_governorate || null,
        governorate_name: form.governorate_name || null,
        x_coordinate: form.x_coordinate || null,
        y_coordinate: form.y_coordinate || null,
        granting_license_approval: form.granting_license_approval || null,
        license_approval_number: form.license_approval_number || null,
        license_approval_date: form.license_approval_date || null,
        license_text_specialization: form.license_text_specialization || null,
        brand: form.brand || null,
        notes: form.notes || null,
        document_value: parseFloat(form.document_value) || 0,
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
          document_id: doc.id,
          document_number: doc.document_number,
          driver_name: form.driver_name,
          type: "charge",
          amount: val,
          description: `وثيقة شحن - ${form.driver_name} - ${form.vehicle_number}`,
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

  const openPreview = async () => {
    const qr = await QRCode.toDataURL(`${window.location.origin}/verify/PREVIEW`, { width: 300, margin: 1 });
    setPreviewQr(qr);
    setPreviewOpen(true);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">إنشاء وثيقة جديدة</h1>
        <p className="text-sm text-muted-foreground">منصة المنتج المحلي - وثيقة شحن</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />معلومات الشركة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الشركة *</Label>
              <Select value={form.company_id} onValueChange={onCompanyChange}>
                <SelectTrigger><SelectValue placeholder="اختر شركة" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>مكاتب النقل</Label>
              <Select value={form.governorate_name} onValueChange={(v) => setForm({ ...form, governorate_name: v })}>
                <SelectTrigger><SelectValue placeholder="اختيار ناقل" /></SelectTrigger>
                <SelectContent>{GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الموضوع</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-accent" />قيمة الوثيقة ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.document_value} onChange={(e) => setForm({ ...form, document_value: e.target.value })} dir="ltr" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5 text-primary" />السائق والمركبة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>اسم السائق *</Label><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>رقم العجلة *</Label><Input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>محافظة تسجيل العجلة</Label>
              <Select value={form.registration_governorate} onValueChange={(v) => setForm({ ...form, registration_governorate: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>سيطرة الدخول *</Label>
              <Select value={form.checkpoint_name_control} onValueChange={(v) => setForm({ ...form, checkpoint_name_control: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{CHECKPOINTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>نوع/تفاصيل الحمولة</Label><Textarea value={form.cargo_typedetails} onChange={(e) => setForm({ ...form, cargo_typedetails: e.target.value })} className="resize-none" /></div>
            <div className="space-y-2"><Label>الوزن/الكمية *</Label><Input value={form.weight_quantity} onChange={(e) => setForm({ ...form, weight_quantity: e.target.value })} /></div>
            <div className="space-y-2"><Label>الوجهة النهائية</Label>
              <Select value={form.destination_governorate} onValueChange={(v) => setForm({ ...form, destination_governorate: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>العلامة التجارية</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />الإجازة / الموافقة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الجهة المانحة</Label><Input value={form.granting_license_approval} onChange={(e) => setForm({ ...form, granting_license_approval: e.target.value })} /></div>
            <div className="space-y-2"><Label>رقم الإجازة</Label><Input value={form.license_approval_number} onChange={(e) => setForm({ ...form, license_approval_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>تاريخ الإجازة</Label><Input type="date" value={form.license_approval_date} onChange={(e) => setForm({ ...form, license_approval_date: e.target.value })} dir="ltr" /></div>
            <div className="space-y-2"><Label>منطوق الإجازة</Label><Input value={form.license_text_specialization} onChange={(e) => setForm({ ...form, license_text_specialization: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button type="button" variant="outline" size="lg" onClick={openPreview}>
          <Eye className="h-4 w-4 ml-2" />
          معاينة الوثيقة
        </Button>
        <Button type="submit" size="lg" disabled={createMut.isPending}>
          <Send className="h-4 w-4 ml-2" />
          {createMut.isPending ? "جاري الإنشاء..." : "إنشاء الوثيقة و رمز QR"}
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[230mm] max-h-[95vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>معاينة الوثيقة قبل الإصدار</DialogTitle>
          </DialogHeader>
          <div className="bg-white shadow-lg mx-auto" style={{ width: "210mm" }}>
            <DocumentTemplate
              doc={{
                document_number: "PREVIEW",
                company_name: form.company_name || "—",
                company_name_project: form.company_name_project,
                subject: form.subject,
                driver_name: form.driver_name || "—",
                vehicle_number: form.vehicle_number || "—",
                licence_number: form.license_approval_number || form.licence_number,
                checkpoint_name_control: form.checkpoint_name_control || "—",
                registration_governorate: form.registration_governorate,
                cargo_typedetails: form.cargo_typedetails,
                weight_quantity: form.weight_quantity || "—",
                destination_governorate: form.destination_governorate,
                governorate_name: form.governorate_name,
                x_coordinate: form.x_coordinate,
                y_coordinate: form.y_coordinate,
                granting_license_approval: form.granting_license_approval,
                license_approval_number: form.license_approval_number,
                license_approval_date: form.license_approval_date,
                license_text_specialization: form.license_text_specialization,
                brand: form.brand,
                notes: form.notes,
                qr_code_data: previewQr,
                document_value: form.document_value,
                created_at: new Date().toISOString(),
                items: [],
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}