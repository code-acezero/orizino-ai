import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminPaymentGateways";

export const Route = createFileRoute("/origin/payment-gateways")({
  component: Page,
});
