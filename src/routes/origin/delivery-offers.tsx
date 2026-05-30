import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminDeliveryOffers";

export const Route = createFileRoute("/origin/delivery-offers")({
  component: Page,
});
