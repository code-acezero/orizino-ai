import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminRequests";

export const Route = createFileRoute("/origin/requests")({
  component: Page,
});
