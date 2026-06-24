import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, ArrowRight } from "lucide-react";
import { DocumentTemplate } from "@/components/document-template";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

export const Route = createFileRoute("/_authenticated/documents/$id")({
  head: () => ({ meta: [{ title: "وثيقة - الكمارك" }] }),
  component: DocumentView,
});

function DocumentView() {
  const { id } = Route.useParams();
  const ref = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  return (
    <div className="bg-muted/30 min-h-screen py-6">
      <div className="max-w-[210mm] mx-auto px-4 mb-3 flex items-center justify-between no-print">
        <Button variant="ghost" asChild><Link to="/documents"><ArrowRight className="h-4 w-4 ml-1" />رجوع</Link></Button>
        <Button onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4 ml-1" />معاينة وتنزيل PDF</Button>
      </div>
      <div ref={ref} className="shadow-lg print:shadow-none mx-auto" style={{ width: "210mm" }}>
        <DocumentTemplate doc={data} />
      </div>
      <PdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        getElement={() => ref.current?.querySelector(".qr-document-root") as HTMLElement | null}
        fileName={`document-${data.document_number}.pdf`}
      />
    </div>
  );
}
