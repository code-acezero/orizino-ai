import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminDashboard";

export const Route = createFileRoute("/origin/")({
  component: Page,
});
