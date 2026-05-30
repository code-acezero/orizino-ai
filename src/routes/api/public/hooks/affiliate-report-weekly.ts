import { createFileRoute } from "@tanstack/react-router";
import { runScheduledReport } from "@/lib/affiliate-report.functions";

export const Route = createFileRoute("/api/public/hooks/affiliate-report-weekly")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await runScheduledReport("weekly");
          return Response.json({ ok: true, ...result });
        } catch (err: any) {
          console.error("affiliate-report-weekly failed:", err);
          return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
        }
      },
    },
  },
});
