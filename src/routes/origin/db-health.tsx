import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminDbHealth";

export const Route = createFileRoute("/origin/db-health")({
  component: Page,
});
