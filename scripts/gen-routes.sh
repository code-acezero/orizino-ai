#!/usr/bin/env bash
set -e
mkdir -p src/routes/_main src/routes/origin

write_route() {
  local file="$1"; local content="$2"
  cat > "$file" <<EOF
$content
EOF
}

# Helper to create a simple route file
simple() {
  local path="$1"; local page="$2"; local routePath="$3"
  cat > "src/routes/$path" <<EOF
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/$page";

export const Route = createFileRoute("$routePath")({
  component: Page,
});
EOF
}

protected() {
  local path="$1"; local page="$2"; local routePath="$3"
  cat > "src/routes/$path" <<EOF
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/$page";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("$routePath")({
  component: () => (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  ),
});
EOF
}

admin() {
  local path="$1"; local page="$2"; local routePath="$3"
  cat > "src/routes/$path" <<EOF
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/$page";

export const Route = createFileRoute("$routePath")({
  component: Page,
});
EOF
}

# Public main layout children
simple "_main/home.tsx" "HomePage" "/_main/home"
simple "_main/auth.tsx" "AuthPage" "/_main/auth"
simple "_main/reset-password.tsx" "ResetPasswordPage" "/_main/reset-password"
simple "_main/shop.tsx" "ShopPage" "/_main/shop"
simple "_main/cart.tsx" "CartPage" "/_main/cart"
simple "_main/wishlist.tsx" "WishlistPage" "/_main/wishlist"
simple "_main/support.tsx" "SupportPage" "/_main/support"
simple "_main/categories.\$slug.tsx" "CategoryPage" "/_main/categories/\$slug"
simple "_main/product.\$slug.tsx" "ProductDetailPage" "/_main/product/\$slug"
simple "_main/page.\$slug.tsx" "CmsPage" "/_main/page/\$slug"

# Protected main layout children
protected "_main/profile.tsx" "ProfilePage" "/_main/profile"
protected "_main/settings.tsx" "SettingsPage" "/_main/settings"
protected "_main/checkout.tsx" "CheckoutPage" "/_main/checkout"
protected "_main/orders.tsx" "OrdersPage" "/_main/orders"
protected "_main/orders.\$id.track.tsx" "LiveTrackingPage" "/_main/orders/\$id/track"

# Admin children
admin "origin/index.tsx" "AdminDashboard" "/origin/"
admin "origin/products.tsx" "AdminProducts" "/origin/products"
admin "origin/categories.tsx" "AdminCategories" "/origin/categories"
admin "origin/orders.tsx" "AdminOrders" "/origin/orders"

admin "origin/reviews.tsx" "AdminReviews" "/origin/reviews"
admin "origin/banners.tsx" "AdminBanners" "/origin/banners"
admin "origin/requests.tsx" "AdminRequests" "/origin/requests"
admin "origin/settings.tsx" "AdminSettings" "/origin/settings"
admin "origin/showcase.tsx" "AdminShowcase" "/origin/showcase"
admin "origin/home.tsx" "AdminHome" "/origin/home"
admin "origin/announcements.tsx" "AdminAnnouncements" "/origin/announcements"
admin "origin/coupons.tsx" "AdminCoupons" "/origin/coupons"
admin "origin/shipping.tsx" "AdminShipping" "/origin/shipping"
admin "origin/support.tsx" "AdminSupport" "/origin/support"
admin "origin/debug.tsx" "AdminDebug" "/origin/debug"
admin "origin/couriers.tsx" "AdminCouriers" "/origin/couriers"
admin "origin/courier-management.tsx" "AdminCourierManagement" "/origin/courier-management"
admin "origin/ai-settings.tsx" "AdminAISettings" "/origin/ai-settings"
admin "origin/user-promos.tsx" "AdminUserPromos" "/origin/user-promos"
admin "origin/delivery-offers.tsx" "AdminDeliveryOffers" "/origin/delivery-offers"
admin "origin/cms-pages.tsx" "AdminCmsPages" "/origin/cms-pages"
admin "origin/landing.tsx" "AdminLanding" "/origin/landing"
admin "origin/branding.tsx" "AdminBranding" "/origin/branding"
admin "origin/mobile-ui.tsx" "AdminMobileUI" "/origin/mobile-ui"
admin "origin/call-settings.tsx" "AdminCallSettings" "/origin/call-settings"
admin "origin/footer.tsx" "AdminFooter" "/origin/footer"
admin "origin/payment-gateways.tsx" "AdminPaymentGateways" "/origin/payment-gateways"
admin "origin/returns.tsx" "AdminReturns" "/origin/returns"
admin "origin/tracking.tsx" "AdminTracking" "/origin/tracking"
admin "origin/pathao.tsx" "AdminCouriers" "/origin/pathao"

echo "Done"
