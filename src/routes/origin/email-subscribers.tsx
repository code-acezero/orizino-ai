import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminEmailSubscribers";

export const Route = createFileRoute("/origin/email-subscribers")({
  component: Page,
});
