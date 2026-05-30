import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ResetPasswordPage";

export const Route = createFileRoute("/_main/reset-password")({
  component: Page,
});
