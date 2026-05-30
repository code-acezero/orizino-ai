import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendBatch } from "@/lib/resend.server";
import { validateCronOrigin } from "@/lib/cron-guard";

/**
 * Cron endpoint: pop unprocessed email_automation_events and create
 * a campaign for each matching active automation. Created campaigns
 * are marked status='scheduled' for schedule_at = now()+delay, so the
 * dispatch-email-campaigns cron actually sends them.
 *
 * Special case: events targeting audience_type='staff_support' are sent
 * directly to the support team (admin/moderator/support roles) instead
 * of going through the campaign pipeline.
 */
export const Route = createFileRoute("/api/public/hooks/process-email-automations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const wrongHost = validateCronOrigin(request);
        if (wrongHost) return wrongHost;
        const provided =
          request.headers.get("apikey") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          "";
        const expected =
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          "";
        if (!expected || provided !== expected) {
          return new Response("unauthorized", { status: 401 });
        }
        const sb = createClient(process.env.SUPABASE_URL!, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY)!, { auth: { autoRefreshToken: false, persistSession: false } });
        const { data: events } = await sb.from("email_automation_events").select("*").is("processed_at", null).order("created_at").limit(50);
        const processed: string[] = [];
        for (const ev of events ?? []) {
          const { data: rules } = await sb.from("email_automations").select("*, template:email_templates(*)").eq("event", ev.event).eq("is_active", true);
          for (const rule of rules ?? []) {
            if (!rule.template) continue;
            const now = new Date();
            const hour = now.getHours();
            if (rule.quiet_hours_start != null && rule.quiet_hours_end != null) {
              const s = rule.quiet_hours_start, e = rule.quiet_hours_end;
              const inQuiet = s <= e ? (hour >= s && hour < e) : (hour >= s || hour < e);
              if (inQuiet) continue;
            }
            const tpl: any = rule.template;
            const subject = rule.subject_override || tpl.subject || ev.payload?.title || ev.payload?.subject || "Update";
            const html = renderTokens(tpl.html, ev.payload ?? {});

            if (rule.audience_type === "staff_support") {
              await sendToSupportStaff(sb, subject, html, ev.payload ?? {});
            } else {
              const scheduleAt = new Date(Date.now() + (rule.delay_minutes ?? 0) * 60_000).toISOString();
              await sb.from("email_campaigns").insert({
                name: `[Auto] ${rule.name} — ${new Date().toLocaleString()}`,
                subject,
                html,
                template_id: tpl.id,
                audience_type: rule.audience_type,
                audience_filter: {},
                status: "scheduled",
                schedule_at: scheduleAt,
              });
            }
            await sb.from("email_automations").update({ last_run_at: now.toISOString(), run_count: (rule.run_count ?? 0) + 1 }).eq("id", rule.id);
          }
          await sb.from("email_automation_events").update({ processed_at: new Date().toISOString() }).eq("id", ev.id);
          processed.push(ev.id);
        }
        return Response.json({ ok: true, processed: processed.length });
      },
    },
  },
});

function renderTokens(html: string, vars: Record<string, any>): string {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}

async function sendToSupportStaff(sb: any, subject: string, html: string, payload: Record<string, any>) {
  const { data: roles } = await sb.from("user_roles").select("user_id").in("role", ["admin", "moderator", "support"]);
  const ids: string[] = Array.from(new Set((roles ?? []).map((r: any) => r.user_id as string)));
  if (ids.length === 0) return;
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emails: string[] = (list?.users ?? [])
    .filter((u: any) => u.email && ids.includes(u.id))
    .map((u: any) => u.email as string);
  if (emails.length === 0) return;

  const { data: settings } = await sb.from("site_settings").select("value").eq("key", "email_senders").maybeSingle();
  const senders = (settings?.value as any)?.senders ?? [];
  const contactSender =
    senders.find((s: any) => s.category === "contact") ||
    senders.find((s: any) => s.is_default) ||
    senders[0];
  const fromName = contactSender?.from_name || "Support";
  const fromEmail = contactSender?.from_email || process.env.RESEND_FROM_EMAIL || "contact@orizino.com";
  const replyTo = contactSender?.reply_to || "contact.orizino@gmail.com";

  const wrapped = `<!doctype html><html><body style="margin:0;background:#f9fafb;padding:24px;font-family:system-ui,-apple-system,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
      <div style="background:#111827;color:#fff;padding:16px 22px"><strong>New support request</strong></div>
      <div style="padding:22px">${html}</div>
      <div style="padding:14px 22px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
        Conversation ID: ${payload.conversation_id ?? "—"}
      </div>
    </div>
  </body></html>`;

  await sendBatch(
    emails.map((to: string) => ({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: wrapped,
      reply_to: replyTo,
      tags: [{ name: "type", value: "support_request" }],
    }))
  );
}
