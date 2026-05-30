import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminTracking";

export const Route = createFileRoute("/origin/tracking")({
  component: Page,
});
