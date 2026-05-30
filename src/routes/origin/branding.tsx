import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminBranding";

export const Route = createFileRoute("/origin/branding")({
  component: Page,
});
