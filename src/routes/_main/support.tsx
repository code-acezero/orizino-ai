import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SupportPage";

export const Route = createFileRoute("/_main/support")({
  component: Page,
});
