import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, DollarSign, Users, FileText } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "التقارير - الكمارك" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports-overview"],
    queryFn: async () => {
      const [{ data: tx = [] }, { data: traders = [] }, { data: docs = [] }] = await Promise.all([
        supabase.from("transactions").select("trader_id, amount, type"),
        supabase.from("traders").select("id, name, phone"),
        supabase.from("documents").select("id, document_value"),
      ]);
      const balByTrader = new Map<string, number>();
      let totalCharges = 0, totalPayments = 0;
      for (const t of tx ?? []) {
        const amt = Number(t.amount || 0);
        if (t.type === "payment") totalPayments += amt; else totalCharges += amt;
        if (!t.trader_id) continue;
        const sign = t.type === "payment" ? -1 : 1;
        balByTrader.set(t.trader_id, (balByTrader.get(t.trader_id) ?? 0) + sign * amt);
      }
      const rows = (traders ?? [])
        .map(t => ({ ...t, balance: balByTrader.get(t.id) ?? 0 }))
        .sort((a, b) => b.balance - a.balance);
      const totalDocsValue = (docs ?? []).reduce((s, d) => s + Number(d.document_value || 0), 0);
      return {
        rows,
        totals: {
          totalCharges, totalPayments,
          outstanding: totalCharges - totalPayments,
          tradersCount: (traders ?? []).length,
          docsCount: (docs ?? []).length,
          totalDocsValue,
        },
      };
    },
  });

  const totals = data?.totals;
  const debtors = (data?.rows ?? []).filter(r => r.balance > 0);
  const creditors = (data?.rows ?? []).filter(r => r.balance < 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">التقارير</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">نظرة شاملة على المحاسبة</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="إجمالي الديون" value={fmtMoney(totals?.outstanding ?? 0)} tone="text-orange-600" />
        <StatCard icon={TrendingUp} label="إجمالي الشحنات" value={fmtMoney(totals?.totalCharges ?? 0)} />
        <StatCard icon={Users} label="عدد التجار" value={String(totals?.tradersCount ?? 0)} />
        <StatCard icon={FileText} label="عدد الوثائق" value={String(totals?.docsCount ?? 0)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">التجار المدينون (الأعلى رصيداً)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>التاجر</TableHead><TableHead>الهاتف</TableHead>
              <TableHead className="text-left">الرصيد ($)</TableHead><TableHead className="w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {debtors.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell dir="ltr" className="text-xs">{r.phone ?? "—"}</TableCell>
                  <TableCell className="text-left font-mono tabular-nums text-orange-600" dir="ltr">{fmtMoney(r.balance)}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" asChild><Link to="/traders/$traderId" params={{ traderId: r.id }}><Eye className="h-4 w-4" /></Link></Button></TableCell>
                </TableRow>
              ))}
              {debtors.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا ديون</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {creditors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">تجار لهم رصيد دائن</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>التاجر</TableHead><TableHead className="text-left">الرصيد ($)</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
              <TableBody>
                {creditors.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="text-left font-mono tabular-nums text-green-600" dir="ltr">{fmtMoney(r.balance)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" asChild><Link to="/traders/$traderId" params={{ traderId: r.id }}><Eye className="h-4 w-4" /></Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
        <div className={`text-base sm:text-2xl font-bold mt-1 tabular-nums break-all ${tone ?? ""}`} dir="ltr">{value}</div>
      </CardContent>
    </Card>
  );
}
