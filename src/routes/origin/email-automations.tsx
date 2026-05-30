import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminEmailAutomations";

export const Route = createFileRoute("/origin/email-automations")({
  component: Page,
});
