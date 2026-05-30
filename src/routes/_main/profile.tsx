import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ProfilePage";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_main/profile")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
