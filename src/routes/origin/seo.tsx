import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminSeo";

export const Route = createFileRoute("/origin/seo")({
  component: Page,
});
