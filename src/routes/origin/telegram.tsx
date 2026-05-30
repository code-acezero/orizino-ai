import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminTelegram";

export const Route = createFileRoute("/origin/telegram")({
  component: Page,
});
