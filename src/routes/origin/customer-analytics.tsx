import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCustomerAnalytics";

export const Route = createFileRoute("/origin/customer-analytics")({
  component: Page,
});
