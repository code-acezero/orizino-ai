import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/SettingsPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_main/settings")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
