import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminStaff";

export const Route = createFileRoute("/origin/corporate/staff")({
  component: Page,
});
