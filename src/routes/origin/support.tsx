import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminSupport";

export const Route = createFileRoute("/origin/support")({
  component: Page,
});
