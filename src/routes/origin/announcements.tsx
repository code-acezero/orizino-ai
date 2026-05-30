import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminAnnouncements";

export const Route = createFileRoute("/origin/announcements")({
  component: Page,
});
