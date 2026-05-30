import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ProductDetailPage";

export const Route = createFileRoute("/_main/product/$slug")({
  component: Page,
});
