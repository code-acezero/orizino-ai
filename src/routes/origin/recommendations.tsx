import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminRecommendations";

export const Route = createFileRoute("/origin/recommendations")({
  component: Page,
});
