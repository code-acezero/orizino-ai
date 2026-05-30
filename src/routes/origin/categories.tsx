import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCategories";

export const Route = createFileRoute("/origin/categories")({
  component: Page,
});
