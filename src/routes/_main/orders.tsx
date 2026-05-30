import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/OrdersPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_main/orders")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
