import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminReviews";

export const Route = createFileRoute("/origin/reviews")({
  component: Page,
});
