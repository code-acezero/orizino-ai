import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminFooter";

export const Route = createFileRoute("/origin/footer")({
  component: Page,
});
