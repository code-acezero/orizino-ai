import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminEmailProvider";

export const Route = createFileRoute("/origin/email-provider")({
  component: Page,
});
