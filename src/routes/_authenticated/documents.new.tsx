import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, Send, Eye, ChevronsUpDown, Check } from "lucide-react";
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
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{selectedRef ? selectedRef.CompanyNameProject : "ابحث عن شركة..."}</span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command shouldFilter={true}>
                  <CommandInput placeholder="ابحث بالاسم أو العلامة..." />
                  <CommandList>
                    <CommandEmpty>لا توجد نتائج</CommandEmpty>
                    <CommandGroup>
                      {REFERENCE.slice(0, 500).map((r, i) => (
                        <CommandItem key={i} value={`${r.CompanyNameProject} ${r.Brand} ${r.GovernorateName}`} onSelect={() => pickReference(i)}>
                          <Check className={`ml-2 h-4 w-4 ${refIndex === i ? "opacity-100" : "opacity-0"}`} />
                          <div className="flex flex-col">
                            <span className="text-sm">{r.CompanyNameProject}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[400px]">{r.GovernorateName} — {r.Brand}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedRef && (
              <div className="text-xs text-muted-foreground rounded-md border p-2 space-y-0.5 bg-muted/30">
                <div>المحافظة: {selectedRef.GovernorateName}</div>
                <div className="truncate">العلامة: {selectedRef.Brand}</div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-accent" />قيمة الوثيقة ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.document_value} onChange={(e) => setForm({ ...form, document_value: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2"><Label>العلامة التجارية</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
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
