import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminAuditLog";

export const Route = createFileRoute("/origin/corporate/audit-log")({
  component: Page,
});
