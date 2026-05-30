import { createFileRoute, Outlet } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLayout } from "@/contexts/LayoutContext";

export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

function MainLayout() {
  const { productTray } = useLayout();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar bottomNavProductTray={productTray} />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
