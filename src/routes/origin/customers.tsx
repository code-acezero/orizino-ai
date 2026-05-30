import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCustomers";

export const Route = createFileRoute("/origin/customers")({
  component: Page,
});
