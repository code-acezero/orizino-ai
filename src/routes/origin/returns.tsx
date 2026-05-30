import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminReturns";

export const Route = createFileRoute("/origin/returns")({
  component: Page,
});
