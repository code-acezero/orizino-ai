import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCmsPages";

export const Route = createFileRoute("/origin/cms-pages")({
  component: Page,
});
