import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * One-click unsubscribe link target. GET sets unsubscribed_at,
 * adds the email to email_suppressions, and shows a confirmation page.
 */
export const Route = createFileRoute("/api/public/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) return html("Invalid unsubscribe link.", 400);

        const admin = createClient(
          process.env.SUPABASE_URL!,
          (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY)!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: sub } = await admin
          .from("email_subscriptions")
          .select("id, email")
          .eq("unsubscribe_token", token)
          .maybeSingle();

        if (!sub) return html("Unsubscribe link not recognised.", 404);

        await admin
          .from("email_subscriptions")
          .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
          .eq("id", sub.id);

        await admin
          .from("email_suppressions")
          .upsert({ email: sub.email.toLowerCase(), reason: "unsubscribe" }, { onConflict: "email" });

        return html(
          `<h1 style="font-family:system-ui;color:#111">You're unsubscribed.</h1>
           <p style="font-family:system-ui;color:#444">${escapeHtml(sub.email)} will no longer receive emails from us. You can resubscribe any time on our site.</p>`
        );
      },
    },
  },
});

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head><body style="background:#f6f7fb;padding:40px;text-align:center">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
