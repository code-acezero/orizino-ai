import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminMobileUI";

export const Route = createFileRoute("/origin/mobile-ui")({
  component: Page,
});
