import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight } from "lucide-react";
import { DocumentTemplate } from "@/components/document-template";
import { exportElementToPdf } from "@/lib/export-pdf";

export const Route = createFileRoute("/_authenticated/documents/$id")({
  head: () => ({ meta: [{ title: "وثيقة - الكمارك" }] }),
  component: DocumentView,
});

function DocumentView() {
  const { id } = Route.useParams();
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data: doc, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: items } = await supabase.from("document_items").select("*").eq("document_id", id);
      return { ...doc, items: items ?? [] };
    },
  });

  if (!data) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  const handleDownload = async () => {
    const el = ref.current?.querySelector(".qr-document-root") as HTMLElement | null;
    if (!el) return;
    await exportElementToPdf(el, `document-${data.document_number}.pdf`);
  };

  return (
    <div className="bg-muted/30 min-h-screen py-6">
      <div className="max-w-[210mm] mx-auto px-4 mb-3 flex items-center justify-between no-print">
        <Button variant="ghost" asChild><Link to="/documents"><ArrowRight className="h-4 w-4 ml-1" />رجوع</Link></Button>
        <Button onClick={handleDownload}><Download className="h-4 w-4 ml-1" />تنزيل PDF</Button>
      </div>
      <div ref={ref} className="shadow-lg print:shadow-none mx-auto" style={{ width: "210mm" }}>
        <DocumentTemplate doc={data} />
      </div>
    </div>
  );
}
