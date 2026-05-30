import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CmsPage";

export const Route = createFileRoute("/_main/page/$slug")({
  component: Page,
});
