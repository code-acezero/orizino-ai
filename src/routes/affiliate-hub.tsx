import { createFileRoute } from "@tanstack/react-router";
import AdminRoute from "@/components/AdminRoute";
import AffiliateHub from "@/pages/admin/AffiliateHub";

export const Route = createFileRoute("/affiliate-hub")({
  component: () => (
    <AdminRoute>
      <AffiliateHub />
    </AdminRoute>
  ),
});
