import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowRight, Plus, Printer, FileText } from "lucide-react";
import { toast } from "sonner";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtMoney = (n: number) => usd.format(Number(n) || 0);

export const Route = createFileRoute("/_authenticated/traders/$traderId")({
  head: () => ({ meta: [{ title: "كشف حساب التاجر" }] }),
  component: TraderStatement,
});

function TraderStatement() {
  const { traderId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");
  const [cargoFilter, setCargoFilter] = useState("all");

  const { data } = useQuery({
    queryKey: ["trader-statement", traderId],
    queryFn: async () => {
      const [{ data: t }, { data: tx }, { data: docs }] = await Promise.all([
        supabase.from("traders").select("*").eq("id", traderId).single(),
        supabase.from("transactions").select("*").eq("trader_id", traderId).order("created_at", { ascending: false }),
        supabase.from("documents").select("id, document_number, document_value, company_name, created_at, status").eq("trader_id", traderId).order("created_at", { ascending: false }),
      ]);
      return { trader: t, transactions: tx ?? [], documents: docs ?? [] };
    },
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      const v = parseFloat(amount);
      if (!v || v <= 0) throw new Error("أدخل مبلغاً صحيحاً");
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("الجلسة غير صالحة");
      // need a company_id (NOT NULL). Use a sentinel: pick the first company. If none, error.
      const { data: anyCo } = await supabase.from("companies").select("id").limit(1).single();
      if (!anyCo) throw new Error("أضف شركة واحدة على الأقل أولاً");
      const { error } = await supabase.from("transactions").insert({
        trader_id: traderId,
        company_id: anyCo.id,
        type: "payment",
        amount: v,
        description: desc || "تسديد تاجر",
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trader-statement", traderId] });
      qc.invalidateQueries({ queryKey: ["trader-balances"] });
      toast.success("تم تسجيل التسديد");
      setOpen(false); setAmount(""); setDesc("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allTx = data?.transactions ?? [];
  const drivers = useMemo(() => Array.from(new Set(allTx.map(t => t.driver_name).filter(Boolean))) as string[], [allTx]);
  const cargos = useMemo(() => Array.from(new Set(allTx.map(t => (t as any).cargo_typedetails).filter(Boolean))) as string[], [allTx]);
  const filteredTx = allTx.filter(t => {
    if (driverFilter !== "all" && t.driver_name !== driverFilter) return false;
    if (cargoFilter !== "all" && (t as any).cargo_typedetails !== cargoFilter) return false;
    return true;
  });
  const balance = filteredTx.reduce((s, t) => s + (t.type === "payment" ? -1 : 1) * Number(t.amount || 0), 0);
  const totalCharges = filteredTx.filter(t => t.type !== "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPayments = filteredTx.filter(t => t.type === "payment").reduce((s, t) => s + Number(t.amount || 0), 0);
  const payments = filteredTx.filter(t => t.type === "payment");
  const charges = filteredTx.filter(t => t.type !== "payment");

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto print:p-0 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild><Link to="/traders"><ArrowRight className="h-4 w-4 ml-1" />رجوع</Link></Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 ml-1" />طباعة</Button>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.trader?.name}</CardTitle>
          <div className="text-sm text-muted-foreground space-y-0.5">
            {data?.trader?.phone && <div dir="ltr">📞 {data.trader.phone}</div>}
            {data?.trader?.address && <div>📍 {data.trader.address}</div>}
            {data?.trader?.notes && <div className="text-xs italic">{data.trader.notes}</div>}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">إجمالي الشحنات</div>
            <div className="text-xl font-bold text-orange-600 tabular-nums" dir="ltr">{fmtMoney(totalCharges)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي القبوضات</div>
            <div className="text-xl font-bold text-green-600 tabular-nums" dir="ltr">{fmtMoney(totalPayments)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">الرصيد الحالي</div>
            <div className={`text-2xl font-bold tabular-nums ${balance > 0 ? "text-orange-600" : balance < 0 ? "text-green-600" : ""}`} dir="ltr">{fmtMoney(balance)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />وثائق التاجر</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>رقم الوثيقة</TableHead><TableHead>التاريخ</TableHead><TableHead>شركة النقل</TableHead><TableHead>القيمة</TableHead><TableHead>الحالة</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data?.documents ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs"><Link to="/documents/$id" params={{ id: d.id }} className="text-primary hover:underline">{d.document_number}</Link></TableCell>
                  <TableCell dir="ltr">{new Date(d.created_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell>{d.company_name}</TableCell>
                  <TableCell className="font-mono tabular-nums" dir="ltr">{fmtMoney(Number(d.document_value))}</TableCell>
                  <TableCell>{d.status}</TableCell>
                </TableRow>
              ))}
              {(data?.documents ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">لا وثائق</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">كشف الحركات</CardTitle>
          <div className="flex flex-wrap gap-2 pt-2 print:hidden">
            <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="all">كل السائقين</option>
              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={cargoFilter} onChange={(e) => setCargoFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="all">كل أنواع الحمل</option>
              {cargos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(driverFilter !== "all" || cargoFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setDriverFilter("all"); setCargoFilter("all"); }}>مسح الفلاتر</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all" dir="rtl">
            <TabsList className="mx-3 mt-2">
              <TabsTrigger value="all">الكل ({filteredTx.length})</TabsTrigger>
              <TabsTrigger value="payments">القبوضات ({payments.length})</TabsTrigger>
              <TabsTrigger value="charges">الشحنات ({charges.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all"><TxTable rows={filteredTx} /></TabsContent>
            <TabsContent value="payments"><TxTable rows={payments} hideType /></TabsContent>
            <TabsContent value="charges"><TxTable rows={charges} hideType /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TxTable({ rows, hideType }: { rows: any[]; hideType?: boolean }) {
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>التاريخ</TableHead>
        {!hideType && <TableHead>النوع</TableHead>}
        <TableHead>المبلغ</TableHead>
        <TableHead>السائق</TableHead>
        <TableHead>نوع الحمل</TableHead>
        <TableHead>الوصف / وثيقة</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.id}>
            <TableCell dir="ltr">{new Date(t.created_at).toLocaleDateString("en-GB")}</TableCell>
            {!hideType && <TableCell>{t.type === "payment" ? <span className="text-green-600">قبض</span> : <span className="text-orange-600">شحن</span>}</TableCell>}
            <TableCell className={`font-mono tabular-nums ${t.type === "payment" ? "text-green-600" : "text-orange-600"}`} dir="ltr">{t.type === "payment" ? "-" : "+"}{fmtMoney(Number(t.amount))}</TableCell>
            <TableCell>{t.driver_name ?? "—"}</TableCell>
            <TableCell className="text-xs">{t.cargo_typedetails ?? "—"}</TableCell>
            <TableCell className="text-xs">{t.document_number ?? t.description ?? "—"}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && <TableRow><TableCell colSpan={hideType ? 5 : 6} className="text-center text-muted-foreground py-8">لا حركات</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}
