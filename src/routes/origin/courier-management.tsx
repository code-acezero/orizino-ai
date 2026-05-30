import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminCourierManagement";

export const Route = createFileRoute("/origin/courier-management")({
  component: Page,
});
