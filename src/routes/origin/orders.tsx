import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminOrders";

export const Route = createFileRoute("/origin/orders")({
  component: Page,
});
