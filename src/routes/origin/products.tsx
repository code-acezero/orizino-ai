import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminProducts";

export const Route = createFileRoute("/origin/products")({
  component: Page,
});
