import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CartPage";

export const Route = createFileRoute("/_main/cart")({
  component: Page,
});
