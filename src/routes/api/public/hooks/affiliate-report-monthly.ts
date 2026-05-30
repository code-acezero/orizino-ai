import { createFileRoute } from "@tanstack/react-router";
import { runScheduledReport } from "@/lib/affiliate-report.functions";

export const Route = createFileRoute("/api/public/hooks/affiliate-report-monthly")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await runScheduledReport("monthly");
          return Response.json({ ok: true, ...result });
        } catch (err: any) {
          console.error("affiliate-report-monthly failed:", err);
          return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
        }
      },
    },
  },
});
