import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminLanding";

export const Route = createFileRoute("/origin/landing")({
  component: Page,
});
