import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCallSettings";

export const Route = createFileRoute("/origin/call-settings")({
  component: Page,
});
