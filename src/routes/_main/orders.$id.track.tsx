import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/LiveTrackingPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_main/orders/$id/track")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
