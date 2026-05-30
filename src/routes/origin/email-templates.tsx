import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminEmailTemplates";

export const Route = createFileRoute("/origin/email-templates")({
  component: Page,
});
