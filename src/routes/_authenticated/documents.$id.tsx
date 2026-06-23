import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, ArrowRight, Download } from "lucide-react";
import { DocumentTemplate } from "@/components/document-template";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { exportElementToPdf } from "@/lib/export-pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents/$id")({
  head: () => ({ meta: [{ title: "وثيقة - الكمارك" }] }),
  component: DocumentView,
});

function DocumentView() {
  const { id } = Route.useParams();
  const ref = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
    setDownloading(true);
    try {
      await exportElementToPdf(el, `document-${data.document_number}.pdf`);
      toast.success("تم تنزيل الوثيقة");
    } catch (e) {
      toast.error("فشل تنزيل PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen py-3 sm:py-6">
      <div className="max-w-[210mm] mx-auto px-3 sm:px-4 mb-3 flex items-center justify-between gap-2 no-print">
        <Button variant="ghost" size="sm" asChild><Link to="/documents"><ArrowRight className="h-4 w-4 ml-1" /><span className="hidden sm:inline">رجوع</span></Link></Button>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">معاينة</span></Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4 sm:ml-1" />
            <span className="hidden sm:inline">{downloading ? "جاري التحميل..." : "تحميل PDF"}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div ref={ref} className="shadow-lg print:shadow-none mx-auto bg-white" style={{ width: "210mm" }}>
          <DocumentTemplate doc={data} />
        </div>
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
