import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "الوثائق - الكمارك" }] }),
  component: DocumentsList,
});

function DocumentsList() {
  const [search, setSearch] = useState("");
  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = docs.filter((d) =>
    !search ||
    d.document_number.includes(search) ||
    d.company_name.includes(search) ||
    d.driver_name.includes(search) ||
    (d.vehicle_number ?? "").includes(search)
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الوثائق</h1>
          <p className="text-sm text-muted-foreground">{docs.length} وثيقة</p>
        </div>
        <Button asChild><Link to="/documents/new"><Plus className="h-4 w-4 ml-1" />وثيقة جديدة</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث برقم الوثيقة أو الشركة أو السائق..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الوثيقة</TableHead>
                <TableHead>الشركة</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>العجلة</TableHead>
                <TableHead>السيطرة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono">{d.document_number}</TableCell>
                  <TableCell>{d.company_name}</TableCell>
                  <TableCell>{d.driver_name}</TableCell>
                  <TableCell>{d.vehicle_number}</TableCell>
                  <TableCell>{d.checkpoint_name_control}</TableCell>
                  <TableCell>{new Date(d.created_at).toLocaleDateString("ar-IQ")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/documents/$id" params={{ id: d.id }}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا وثائق</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}