import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WishlistPage";

export const Route = createFileRoute("/_main/wishlist")({
  component: Page,
});
