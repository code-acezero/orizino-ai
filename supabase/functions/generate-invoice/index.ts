// Generates an HTML invoice for an order. Optionally emails it via Resend.
// Body: { order_id: string, send_email?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function esc(s: any): string {
  return String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;" }[c]!));
}

function money(n: any): string {
  const v = Number(n || 0);
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface InvoiceOpts {
  invoice_prefix: string;
  accent_color: string;
  footer_note: string;
  terms: string;
  show_tax_line: boolean;
  show_paid_stamp: boolean;
  tax_rate: number;
}

function buildHtml(
  order: any,
  items: any[],
  profile: any,
  brand: { name: string; addr: string; email: string },
  opts: InvoiceOpts,
): string {
  const addr = order.shipping_address || {};
  const rows = items.map((it) => `
    <tr>
      <td>${esc(it.product_name)}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">${money(it.unit_price)}</td>
      <td style="text-align:right">${money(it.total_price)}</td>
    </tr>`).join("");

  const isPaid = String(order.payment_status || "").toLowerCase() === "paid"
    || String(order.status || "").toLowerCase() === "delivered";
  const invoiceNumber = `${opts.invoice_prefix}-${esc(order.order_number)}`;
  const subtotal = Number(order.subtotal || 0);
  const taxAmount = opts.show_tax_line && opts.tax_rate > 0
    ? subtotal * (opts.tax_rate / 100)
    : 0;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(invoiceNumber)}</title>
  <style>
    *{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:32px;max-width:820px;margin:auto;position:relative}
    h1{margin:0 0 4px;font-size:28px}.muted{color:#666}.row{display:flex;justify-content:space-between;gap:24px;margin-bottom:24px}
    .accent-bar{height:4px;background:${esc(opts.accent_color)};border-radius:2px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border-bottom:1px solid #eee;font-size:14px;text-align:left}
    th{background:#fafafa;font-weight:600}.totals{margin-top:16px;width:280px;margin-left:auto}.totals td{border:none;padding:4px 0}
    .totals tr.grand td{border-top:2px solid #111;font-weight:700;font-size:16px;padding-top:8px}
    .badge{display:inline-block;padding:2px 10px;background:${esc(opts.accent_color)}1a;color:${esc(opts.accent_color)};border-radius:999px;font-size:12px;font-weight:600;text-transform:uppercase}
    .paid-stamp{position:absolute;top:140px;right:60px;border:4px solid #16a34a;color:#16a34a;padding:8px 24px;font-size:32px;font-weight:800;letter-spacing:4px;transform:rotate(-12deg);opacity:.85;border-radius:8px}
    .terms{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#666;line-height:1.5}
    @media print{body{padding:0}}
  </style></head><body>
    <div class="accent-bar"></div>
    ${isPaid && opts.show_paid_stamp ? `<div class="paid-stamp">PAID</div>` : ""}
    <div class="row">
      <div>
        <h1>${esc(brand.name)}</h1>
        <div class="muted">${esc(brand.addr)}</div>
        <div class="muted">${esc(brand.email)}</div>
      </div>
      <div style="text-align:right">
        <h1>INVOICE</h1>
        <div class="muted">#${esc(invoiceNumber)}</div>
        <div class="muted">${new Date(order.created_at).toLocaleDateString()}</div>
        <div style="margin-top:6px"><span class="badge">${esc(order.status)}</span></div>
      </div>
    </div>
    <div class="row">
      <div>
        <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:1px">Billed to</div>
        <div style="font-weight:600">${esc(profile?.full_name || addr.name || "Customer")}</div>
        <div class="muted">${esc(addr.address || "")}</div>
        <div class="muted">${esc(addr.city || "")} ${esc(addr.postal_code || "")}</div>
        <div class="muted">${esc(addr.phone || "")}</div>
      </div>
      <div>
        <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:1px">Payment</div>
        <div>${esc(order.payment_method || "—")}</div>
        ${order.transaction_id ? `<div class="muted">Txn: ${esc(order.transaction_id)}</div>` : ""}
      </div>
    </div>
    <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
    <table class="totals"><tbody>
      <tr><td>Subtotal</td><td style="text-align:right">${money(subtotal)}</td></tr>
      ${taxAmount > 0 ? `<tr><td>Tax (${opts.tax_rate}%)</td><td style="text-align:right">${money(taxAmount)}</td></tr>` : ""}
      <tr><td>Shipping</td><td style="text-align:right">${money(order.shipping_fee)}</td></tr>
      ${order.coupon_discount ? `<tr><td>Coupon (${esc(order.coupon_code)})</td><td style="text-align:right">−${money(order.coupon_discount)}</td></tr>` : ""}
      ${order.loyalty_discount ? `<tr><td>Loyalty</td><td style="text-align:right">−${money(order.loyalty_discount)}</td></tr>` : ""}
      <tr class="grand"><td>Total</td><td style="text-align:right">${money(order.total)}</td></tr>
    </tbody></table>
    <p class="muted" style="text-align:center;margin-top:48px;font-size:13px">${esc(opts.footer_note || `Thank you for shopping with ${brand.name}.`)}</p>
    ${opts.terms ? `<div class="terms"><strong>Terms & Conditions</strong><br/>${esc(opts.terms)}</div>` : ""}
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { order_id, send_email } = await req.json().catch(() => ({}));
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderErr } = await admin.from("orders").select("*").eq("id", order_id).maybeSingle();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: items } = await admin.from("order_items").select("*").eq("order_id", order_id);
    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", (order as any).user_id).maybeSingle();

    // Brand info from site settings (best-effort)
    let brand = { name: "Orizino", addr: "", email: "team@orizino.com" };
    try {
      const { data: brandSet } = await admin.from("site_settings").select("value").eq("key", "brand_settings").maybeSingle();
      const v: any = brandSet?.value || {};
      brand = {
        name: v.brand_name || v.site_name || "Orizino",
        addr: v.address || "",
        email: v.support_email || "team@orizino.com",
      };
    } catch { /* ignore */ }

    // Invoice + tax options
    const opts = {
      invoice_prefix: "INV",
      accent_color: "#3730a3",
      footer_note: "",
      terms: "",
      show_tax_line: true,
      show_paid_stamp: true,
      tax_rate: 0,
    };
    try {
      const { data: settingsRows } = await admin
        .from("site_settings")
        .select("key, value")
        .in("key", ["invoice_settings", "invoice_prefix", "tax_rate"]);
      for (const row of settingsRows || []) {
        const v: any = (row as any).value?.value ?? (row as any).value;
        if ((row as any).key === "invoice_settings" && v && typeof v === "object") {
          Object.assign(opts, v);
        } else if ((row as any).key === "invoice_prefix" && v) {
          opts.invoice_prefix = String(v);
        } else if ((row as any).key === "tax_rate" && v != null) {
          opts.tax_rate = Number(v) || 0;
        }
      }
    } catch { /* ignore */ }

    const invoice_html = buildHtml(order, items || [], profile, brand, opts);

    let emailed = false;
    let emailError: string | null = null;
    if (send_email && RESEND_API_KEY) {
      const addr: any = (order as any).shipping_address || {};
      const recipient = addr.email || null;
      if (!recipient) {
        emailError = "No recipient email on order";
      } else {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: `${brand.name} <${brand.email}>`,
            to: [recipient],
            subject: `Invoice for order #${(order as any).order_number}`,
            html: invoice_html,
          }),
        });
        if (res.ok) {
          emailed = true;
        } else {
          emailError = `Resend ${res.status}: ${await res.text()}`;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, invoice_html, emailed, emailError }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-invoice error:", e);
    return new Response(JSON.stringify({ error: e?.message || "internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});