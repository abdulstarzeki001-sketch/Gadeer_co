import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Wallet, Plus } from "lucide-react";
import { fmtMoney, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "اللوحة الرئيسية - الكمارك" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [comp, docs, tx] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id, document_value", { count: "exact" }),
        supabase.from("transactions").select("amount"),
      ]);
      const totalValue = (docs.data ?? []).reduce((s, d) => s + Number(d.document_value || 0), 0);
      const totalCharge = (tx.data ?? []).reduce((s, t) => s + Number(t.amount || 0), 0);
      return {
        companies: comp.count ?? 0,
        documents: docs.count ?? 0,
        totalValue,
        totalCharge,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-docs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, document_number, company_name, driver_name, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">اللوحة الرئيسية</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">نظرة عامة على النظام</p>
        </div>
        <Button size="sm" asChild className="shrink-0">
          <Link to="/documents/new"><Plus className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">وثيقة جديدة</span><span className="sm:hidden">جديدة</span></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Building2 className="h-5 w-5" />} label="الشركات" value={stats?.companies ?? 0} />
        <StatCard icon={<FileText className="h-5 w-5" />} label="الوثائق" value={stats?.documents ?? 0} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="قيمة الوثائق" value={fmtMoney(stats?.totalValue ?? 0)} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="مجموع الحركات" value={fmtMoney(stats?.totalCharge ?? 0)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">آخر الوثائق</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {(recent ?? []).map((d) => (
              <Link key={d.id} to="/documents/$id" params={{ id: d.id }} className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded">
                <div>
                  <div className="font-medium">{d.document_number}</div>
                  <div className="text-xs text-muted-foreground">{d.company_name} — {d.driver_name}</div>
                </div>
                <div className="text-xs text-muted-foreground" dir="ltr">{fmtDate(d.created_at)}</div>
              </Link>
            ))}
            {recent && recent.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">لا توجد وثائق بعد</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-base sm:text-xl font-bold tabular-nums break-all">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}