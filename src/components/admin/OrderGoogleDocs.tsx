import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileBox, FileText, ExternalLink, Trash2, Loader2, Download, AlertCircle } from "lucide-react";
import { toast } from "@/lib/app-toast";
import { format } from "date-fns";
import { removeOrderDocument } from "@/lib/order-documents.functions";
import { downloadInvoiceDocx, downloadStickerDocx, type DocxBrand } from "@/lib/invoice-docx";

interface Props {
  orderId: string;
  orderNumber: string;
}

interface OrderDoc {
  id: string;
  doc_type: "invoice" | "sticker";
  external_url: string;
  pdf_url: string | null;
  title: string | null;
  status: string;
  trigger_reason: string;
  folder_id: string | null;
  error_message: string | null;
  created_at: string;
}

export default function OrderGoogleDocs({ orderId, orderNumber }: Props) {
  const qc = useQueryClient();
  const removeFn = useServerFn(removeOrderDocument);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["order_documents", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_documents")
        .select("id, doc_type, external_url, pdf_url, title, status, trigger_reason, folder_id, error_message, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as OrderDoc[];
    },
  });

  const loadBrand = async (): Promise<DocxBrand> => {
    const fallback: DocxBrand = { name: "Orizino", currency: "৳", prefix: "INV" };
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["brand_settings", "invoice_settings"]);
      const map: Record<string, any> = {};
      for (const r of data || []) map[(r as any).key] = (r as any).value || {};
      const b = map.brand_settings || {};
      const inv = map.invoice_settings || {};
      return {
        name: b.brand_name || b.site_name || "Orizino",
        addr: b.address || "",
        email: b.support_email || "",
        phone: b.phone || b.support_phone || "",
        currency: b.currency_symbol || "৳",
        prefix: inv.invoice_prefix || "INV",
        footer: inv.footer_note || "",
      };
    } catch {
      return fallback;
    }
  };

  const downloadDocx = async (doc_type: "invoice" | "sticker") => {
    setBusy(`docx:${doc_type}`);
    try {
      const [{ data: order, error: oErr }, brand] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        loadBrand(),
      ]);
      if (oErr || !order) throw new Error(oErr?.message || "Order not found");
      if (doc_type === "invoice") {
        const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
        await downloadInvoiceDocx(order, items || [], brand);
      } else {
        await downloadStickerDocx(order, brand);
      }
      toast.success(`${doc_type === "invoice" ? "Invoice" : "Sticker"} downloaded (.docx)`);
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    }
    setBusy(null);
  };

  const exportPdf = async (id: string, existing: string | null) => {
    if (existing) {
      window.open(existing, "_blank");
      return;
    }
    setBusy(`pdf:${id}`);
    try {
      const { data, error } = await supabase.functions.invoke("gdocs-export-pdf", {
        body: { order_document_id: id },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "PDF export failed");
      } else {
        toast.success("PDF saved");
        qc.invalidateQueries({ queryKey: ["order_documents", orderId] });
        if (data?.pdf_url) window.open(data.pdf_url, "_blank");
      }
    } catch (e: any) {
      toast.error(e?.message || "PDF export failed");
    }
    setBusy(null);
  };

  const remove = async (id: string) => {
    setBusy(`del:${id}`);
    try {
      await removeFn({ data: { id } });
      toast.success("Link removed (Google Doc not deleted)");
      qc.invalidateQueries({ queryKey: ["order_documents", orderId] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove link");
    }
    setBusy(null);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <FileBox className="w-4 h-4 text-primary" /> Google Docs Archive
          </div>
          <div className="text-xs text-muted-foreground">
            Save invoice & shipping sticker for order #{orderNumber} to Google Drive.
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => archive("invoice")} className="gap-1.5">
            {busy === "archive:invoice" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Save Invoice
          </Button>
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => archive("sticker")} className="gap-1.5">
            {busy === "archive:sticker" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileBox className="w-3.5 h-3.5" />}
            Save Sticker
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">No archived documents yet.</div>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge variant={d.doc_type === "invoice" ? "default" : "secondary"} className="capitalize">
                  {d.doc_type}
                </Badge>
                {d.trigger_reason !== "manual" && (
                  <Badge variant="outline" className="capitalize text-[10px]">auto · {d.trigger_reason}</Badge>
                )}
                {d.status === "failed" && (
                  <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />failed</Badge>
                )}
                <span className="truncate" title={d.title || ""}>{d.title || "Untitled"}</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(d.created_at), "MMM d, HH:mm")}
                </span>
                {d.error_message && (
                  <span className="text-destructive truncate" title={d.error_message}>· {d.error_message}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={d.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary/40 text-primary"
                >
                  Doc <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => exportPdf(d.id, d.pdf_url)}
                  disabled={busy === `pdf:${d.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary/40 disabled:opacity-50"
                  title={d.pdf_url ? "Open PDF" : "Generate PDF"}
                >
                  {busy === `pdf:${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  PDF
                </button>
                <button
                  onClick={() => remove(d.id)}
                  disabled={busy === `del:${d.id}`}
                  className="p-1 rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-50"
                  aria-label="Remove link"
                >
                  {busy === `del:${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
