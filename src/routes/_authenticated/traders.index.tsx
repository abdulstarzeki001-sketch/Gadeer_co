import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Eye, Pencil, Trash2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/traders/")({
  head: () => ({ meta: [{ title: "التجار - الكمارك" }] }),
  component: TradersList,
});

type Trader = { id: string; name: string; phone: string | null; address: string | null; notes: string | null };

function TradersList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trader | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });

  const { data: traders = [] } = useQuery({
    queryKey: ["traders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("traders").select("*").order("name");
      if (error) throw error;
      return data as Trader[];
    },
  });

  const { data: balances = {} } = useQuery({
    queryKey: ["trader-balances"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("trader_id, amount, type").not("trader_id", "is", null);
      if (error) throw error;
      const m: Record<string, number> = {};
      for (const t of data ?? []) {
        if (!t.trader_id) continue;
        const sign = t.type === "payment" ? -1 : 1;
        m[t.trader_id] = (m[t.trader_id] ?? 0) + sign * Number(t.amount || 0);
      }
      return m;
    },
  });

  const resetForm = () => { setForm({ name: "", phone: "", address: "", notes: "" }); setEditing(null); };

  const openEdit = (t: Trader) => {
    setEditing(t);
    setForm({ name: t.name, phone: t.phone ?? "", address: t.address ?? "", notes: t.notes ?? "" });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("الاسم مطلوب");
      if (name.length > 200) throw new Error("الاسم طويل جداً");
      const payload = {
        name,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("traders").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) throw new Error("الجلسة غير صالحة");
        const { error } = await supabase.from("traders").insert({ ...payload, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traders"] });
      toast.success(editing ? "تم تحديث التاجر" : "تم إضافة التاجر");
      setOpen(false); resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("traders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traders"] });
      toast.success("تم الحذف");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التجار</h1>
          <p className="text-sm text-muted-foreground">إدارة التجار وأرصدتهم</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" />تاجر جديد</Button></DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>{editing ? "تعديل تاجر" : "تاجر جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={200} /></div>
              <div><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} dir="ltr" /></div>
              <div><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={300} /></div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} /></div>
            </div>
            <DialogFooter><Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>حفظ</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">قائمة التجار</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead className="text-left">الرصيد ($)</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {traders.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell dir="ltr" className="text-xs">{t.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span> : "—"}</TableCell>
                  <TableCell className="text-xs">{t.address ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{t.address}</span> : "—"}</TableCell>
                  <TableCell className="text-left font-mono tabular-nums" dir="ltr">{fmtMoney(balances[t.id] ?? 0)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild><Link to="/traders/$traderId" params={{ traderId: t.id }}><Eye className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`حذف ${t.name}؟`)) delMut.mutate(t.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {traders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا يوجد تجار. أضف تاجراً جديداً.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
