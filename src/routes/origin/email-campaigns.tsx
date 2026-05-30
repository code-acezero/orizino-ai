import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminEmailCampaigns";

export const Route = createFileRoute("/origin/email-campaigns")({
  component: Page,
});
