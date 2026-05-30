import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminShowcase";

export const Route = createFileRoute("/origin/showcase")({
  component: Page,
});
