import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CategoryPage";

export const Route = createFileRoute("/_main/categories/$slug")({
  component: Page,
});
