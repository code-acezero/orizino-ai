import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminUserPromos";

export const Route = createFileRoute("/origin/user-promos")({
  component: Page,
});
