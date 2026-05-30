import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminShipping";

export const Route = createFileRoute("/origin/shipping")({
  component: Page,
});
