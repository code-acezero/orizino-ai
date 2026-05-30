import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminDebug";

export const Route = createFileRoute("/origin/debug")({
  component: Page,
});
