import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "التحقق من وثيقة" }] }),
  component: VerifyEntry,
});

function VerifyEntry() {
  const [n, setN] = useState("");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/10" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle>التحقق من وثيقة شحن</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); if (n.trim()) navigate({ to: "/verify/$documentNumber", params: { documentNumber: n.trim() } }); }} className="space-y-3">
            <Input placeholder="رقم الوثيقة (YYYY-NNNNNN)" value={n} onChange={(e) => setN(e.target.value)} dir="ltr" />
            <Button type="submit" className="w-full">تحقق</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}