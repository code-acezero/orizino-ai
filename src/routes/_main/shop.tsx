import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ShopPage";

export const Route = createFileRoute("/_main/shop")({
  component: Page,
});
