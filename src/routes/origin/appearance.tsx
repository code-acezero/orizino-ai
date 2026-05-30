import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminAppearance";

export const Route = createFileRoute("/origin/appearance")({
  component: Page,
});