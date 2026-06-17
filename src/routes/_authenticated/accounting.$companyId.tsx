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
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounting/$companyId")({
  head: () => ({ meta: [{ title: "كشف حساب - الكمارك" }] }),
  component: CompanyStatement,
});

function CompanyStatement() {
  const { companyId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const { data } = useQuery({
    queryKey: ["company-statement", companyId],
    queryFn: async () => {
      const [{ data: c }, { data: tx }] = await Promise.all([
        supabase.from("companies").select("*").eq("id", companyId).single(),
        supabase.from("transactions").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      ]);
      return { company: c, transactions: tx ?? [] };
    },
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      const v = parseFloat(amount);
      if (!v || v <= 0) throw new Error("أدخل مبلغاً صحيحاً");
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("الجلسة غير صالحة");
      const { error } = await supabase.from("transactions").insert({
        company_id: companyId, type: "payment", amount: v, description: desc || "تسديد", created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-statement", companyId] });
      qc.invalidateQueries({ queryKey: ["accounting-summary"] });
      toast.success("تم تسجيل التسديد");
      setOpen(false); setAmount(""); setDesc("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const balance = (data?.transactions ?? []).reduce((s, t) => s + (t.type === "payment" ? -1 : 1) * Number(t.amount || 0), 0);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild><Link to="/accounting"><ArrowRight className="h-4 w-4 ml-1" />رجوع</Link></Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" />تسديد</Button></DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>تسجيل تسديد</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>المبلغ ($)</Label><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" /></div>
              <div><Label>وصف</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={() => addPayment.mutate()} disabled={addPayment.isPending}>حفظ</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{data?.company?.company_name}</CardTitle>
          <p className="text-sm text-muted-foreground">{data?.company?.governorate}</p>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" dir="ltr">${balance.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">الرصيد الحالي</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">الحركات</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>المبلغ</TableHead><TableHead>الوصف</TableHead><TableHead>وثيقة</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data?.transactions ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.created_at).toLocaleDateString("ar-IQ")}</TableCell>
                  <TableCell>{t.type === "payment" ? <span className="text-green-600">تسديد</span> : <span className="text-orange-600">شحن</span>}</TableCell>
                  <TableCell className="font-mono" dir="ltr">{Number(t.amount).toFixed(2)}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className="font-mono text-xs">{t.document_number}</TableCell>
                </TableRow>
              ))}
              {(data?.transactions ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا حركات</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}