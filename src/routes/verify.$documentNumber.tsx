import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentTemplate } from "@/components/document-template";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Eye } from "lucide-react";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

export const Route = createFileRoute("/verify/$documentNumber")({
  head: () => ({ meta: [{ title: "نتيجة التحقق" }] }),
  component: VerifyResult,
});

function VerifyResult() {
  const { documentNumber } = Route.useParams();
  const ref = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["verify", documentNumber],
    queryFn: async () => {
      const { data: doc } = await supabase.from("documents").select("*").eq("document_number", documentNumber).maybeSingle();
      if (!doc) return null;
      const { data: items } = await supabase.from("document_items").select("*").eq("document_id", doc.id);
      return { ...doc, items: items ?? [] };
    },
  });

  if (isLoading) return <div className="p-12 text-center">جاري التحقق...</div>;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-3">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">الوثيقة غير موجودة</h2>
            <p className="text-muted-foreground text-sm">رقم الوثيقة <span className="font-mono">{documentNumber}</span> غير مسجل.</p>
            <Button asChild variant="outline"><Link to="/verify">رجوع</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-6" dir="rtl">
      <div className="max-w-[210mm] mx-auto px-4 mb-3 no-print">
        <Card className="border-2 border-green-500">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-bold text-green-700">وثيقة صحيحة وموثقة</div>
                <div className="text-xs text-muted-foreground">صادرة من الهيئة العامة للكمارك</div>
              </div>
            </div>
            <Button onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4 ml-1" />معاينة وتنزيل PDF</Button>
          </CardContent>
        </Card>
      </div>
      <div ref={ref}>
        <DocumentTemplate doc={data} />
      </div>
      <PdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        getElement={() => ref.current?.querySelector(".qr-document-root") as HTMLElement | null}
        fileName={`document-${documentNumber}.pdf`}
      />
    </div>
  );
}