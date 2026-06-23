import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounting")({
  head: () => ({ meta: [{ title: "المحاسبة - الكمارك" }] }),
  component: AccountingPage,
});

function AccountingPage() {
  const { data: rows = [] } = useQuery({
    queryKey: ["accounting-summary"],
    queryFn: async () => {
      const [{ data: companies = [] }, { data: tx = [] }] = await Promise.all([
        supabase.from("companies").select("id, company_name, governorate"),
        supabase.from("transactions").select("company_id, amount, type"),
      ]);
      const sums = new Map<string, number>();
      for (const t of tx ?? []) {
        const sign = t.type === "payment" ? -1 : 1;
        sums.set(t.company_id, (sums.get(t.company_id) ?? 0) + sign * Number(t.amount || 0));
      }
      return (companies ?? [])
        .map((c) => ({ ...c, balance: sums.get(c.id) ?? 0 }))
        .filter((r) => r.balance !== 0)
        .sort((a, b) => b.balance - a.balance);
    },
  });

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div><h1 className="text-2xl font-bold">المحاسبة</h1><p className="text-sm text-muted-foreground">ملخص الأرصدة بالدولار</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">الشركات ذات الأرصدة</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>المحافظة</TableHead>
                <TableHead className="text-left">الرصيد ($)</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.company_name}</TableCell>
                  <TableCell>{r.governorate}</TableCell>
                  <TableCell className="text-left font-mono tabular-nums" dir="ltr">{fmtMoney(r.balance)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/accounting/$companyId" params={{ companyId: r.id }}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">لا أرصدة</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}