import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminHome";

export const Route = createFileRoute("/origin/home")({
  component: Page,
});
