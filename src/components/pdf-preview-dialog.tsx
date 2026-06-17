import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { renderElementToCanvas, canvasToPdf } from "@/lib/export-pdf";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  getElement: () => HTMLElement | null;
  fileName: string;
}

export function PdfPreviewDialog({ open, onOpenChange, getElement, fileName }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setDataUrl(null);
      setCanvas(null);
      return;
    }
    const el = getElement();
    if (!el) return;
    setLoading(true);
    renderElementToCanvas(el)
      .then((c) => {
        setCanvas(c);
        setDataUrl(c.toDataURL("image/png"));
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleDownload = () => {
    if (!canvas) return;
    const pdf = canvasToPdf(canvas);
    pdf.save(fileName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>معاينة الوثيقة قبل التنزيل</DialogTitle>
        </DialogHeader>
        <div className="bg-muted/40 p-4 flex justify-center min-h-[300px] items-center">
          {loading || !dataUrl ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <img src={dataUrl} alt="preview" className="max-w-full h-auto shadow-lg" />
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleDownload} disabled={!canvas}>
            <Download className="h-4 w-4 ml-1" />
            تنزيل PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
