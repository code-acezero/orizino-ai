import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminLiveActivity";

export const Route = createFileRoute("/origin/live-activity")({
  component: Page,
});
