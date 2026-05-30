import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/HomePage";

export const Route = createFileRoute("/_main/home")({
  component: Page,
});
