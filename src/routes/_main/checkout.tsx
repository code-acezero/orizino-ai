import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CheckoutPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_main/checkout")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
