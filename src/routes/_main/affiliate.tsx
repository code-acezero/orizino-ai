import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AffiliatePage";

export const Route = createFileRoute("/_main/affiliate")({
  component: Page,
});
