import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminBanners";

export const Route = createFileRoute("/origin/banners")({
  component: Page,
});
