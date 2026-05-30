import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminAISettings";

export const Route = createFileRoute("/origin/ai-settings")({
  component: Page,
});
