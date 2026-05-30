import { createFileRoute } from "@tanstack/react-router";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/origin")({
  component: () => (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  ),
});
