import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminSettings";

export const Route = createFileRoute("/origin/settings")({
  component: Page,
});
