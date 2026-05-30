import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminEmailCampaignEditor";

export const Route = createFileRoute("/origin/email-campaigns/$id")({
  component: Page,
});
