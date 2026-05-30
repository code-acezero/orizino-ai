import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCouriers";

export const Route = createFileRoute("/origin/couriers")({
  component: Page,
});
