import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import companiesJson from "@/data/companies.json";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [{ title: "الشركات - الكمارك" }] }),
  component: CompaniesPage,
});

type RawCompany = { Number: number; Brand: string; CompanyNameProject: string; GovernorateName: string };
const SOURCE = companiesJson as RawCompany[];

function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: "", license_number: "", specialization: "", governorate: "", brand: "", phone: "", email: "", address: "" });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      if (editId) {
        const { error } = await supabase.from("companies").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success(editId ? "تم التعديل" : "تمت إضافة الشركة");
      setOpen(false);
      setEditId(null);
      setForm({ company_name: "", license_number: "", specialization: "", governorate: "", brand: "", phone: "", email: "", address: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast.success("تم الحذف"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: async () => {
      const existing = new Set(companies.map((c) => c.company_name.trim()));
      const fresh = SOURCE
        .filter((r) => r.CompanyNameProject && !existing.has(r.CompanyNameProject.trim()))
        .map((r) => ({
          company_name: r.CompanyNameProject.trim(),
          governorate: r.GovernorateName || "",
          brand: r.Brand || "",
          license_number: String(r.Number || ""),
          specialization: "",
        }));
      if (fresh.length === 0) return { inserted: 0 };
      const chunkSize = 500;
      let inserted = 0;
      for (let i = 0; i < fresh.length; i += chunkSize) {
        const chunk = fresh.slice(i, i + chunkSize);
        const { error } = await supabase.from("companies").insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }
      return { inserted };
    },
    onSuccess: ({ inserted }) => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success(`تم استيراد ${inserted} شركة`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = companies.filter((c) =>
    !search || c.company_name.includes(search) || (c.brand ?? "").includes(search) || (c.governorate ?? "").includes(search)
  );

  const startEdit = (c: typeof companies[number]) => {
    setEditId(c.id);
    setForm({
      company_name: c.company_name,
      license_number: c.license_number ?? "",
      specialization: c.specialization ?? "",
      governorate: c.governorate ?? "",
      brand: c.brand ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الشركات</h1>
          <p className="text-sm text-muted-foreground">{companies.length} شركة مسجلة — قاعدة المصدر: {SOURCE.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => importMut.mutate()} disabled={importMut.isPending}>
            <Upload className="h-4 w-4 ml-1" />استيراد من JSON
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-1" />شركة جديدة</Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader><DialogTitle>{editId ? "تعديل شركة" : "إضافة شركة"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><Label>اسم الشركة *</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                <div><Label>المحافظة</Label><Input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} /></div>
                <div><Label>رقم الإجازة</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>الاختصاص</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>العلامة التجارية</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
                <div><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>البريد</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => saveMut.mutate(form)} disabled={!form.company_name || saveMut.isPending}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الشركة</TableHead>
                <TableHead>المحافظة</TableHead>
                <TableHead>العلامة</TableHead>
                <TableHead>الاختصاص</TableHead>
                <TableHead className="w-28">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell>{c.governorate}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.brand}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.specialization}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("حذف الشركة؟")) deleteMut.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا نتائج</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 200 && <div className="text-xs text-muted-foreground p-3 border-t">عرض أول 200 — استخدم البحث لتضييق النتائج</div>}
        </CardContent>
      </Card>
    </div>
  );
}