import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCoupons";

export const Route = createFileRoute("/origin/coupons")({
  component: Page,
});
