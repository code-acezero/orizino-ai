import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AuthPage";

export const Route = createFileRoute("/_main/auth")({
  component: Page,
});
