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
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const companySchema = z.object({
  company_name: z.string().trim().nonempty({ message: "اسم الشركة مطلوب" }).max(150, { message: "اسم الشركة طويل جداً" }),
  address: z.string().trim().nonempty({ message: "العنوان مطلوب" }).max(300, { message: "العنوان طويل جداً" }),
});

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [{ title: "الشركات - الكمارك" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: "", address: "" });
  const [errors, setErrors] = useState<{ company_name?: string; address?: string }>({});

  const handleSave = () => {
    const result = companySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: { company_name?: string; address?: string } = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as "company_name" | "address";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] ?? "تحقق من الحقول");
      return;
    }
    setErrors({});
    saveMut.mutate(result.data);
  };

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
      setForm({ company_name: "", address: "" });
      setErrors({});
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


  const filtered = companies.filter((c) =>
    !search || c.company_name.includes(search) || (c.address ?? "").includes(search)
  );

  const startEdit = (c: typeof companies[number]) => {
    setEditId(c.id);
    setForm({
      company_name: c.company_name,
      address: c.address ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الشركات (العملاء)</h1>
          <p className="text-sm text-muted-foreground">{companies.length} شركة — تُضاف يدوياً أو تلقائياً عند إنشاء وثيقة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-1" />شركة جديدة</Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader><DialogTitle>{editId ? "تعديل شركة" : "إضافة شركة"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>اسم الشركة *</Label>
                  <Input maxLength={150} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} aria-invalid={!!errors.company_name} />
                  {errors.company_name && <p className="text-xs text-destructive mt-1">{errors.company_name}</p>}
                </div>
                <div>
                  <Label>العنوان *</Label>
                  <Input maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} aria-invalid={!!errors.address} />
                  {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={saveMut.isPending}>حفظ</Button>
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
                <TableHead>العنوان</TableHead>
                <TableHead className="w-28">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{c.address}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("حذف الشركة؟")) deleteMut.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">لا نتائج</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 200 && <div className="text-xs text-muted-foreground p-3 border-t">عرض أول 200 — استخدم البحث لتضييق النتائج</div>}
        </CardContent>
      </Card>
    </div>
  );
}