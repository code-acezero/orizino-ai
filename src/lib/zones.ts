// Hostname-based zone routing for the single-Worker "monorepo" split.
//
// One deployed app serves three subdomains:
//   - company  → orizino.com      (landing / docs / marketing)
//   - shop     → shop.orizino.com (customer storefront)
//   - master   → mp.orizino.com   (master panel / admin)
//
// These helpers are PURE and isomorphic (safe on server + client). The actual
// redirect enforcement lives in src/start.ts (SSR request middleware) and
// src/components/ZoneGuard.tsx (client SPA navigation).

export type Zone = "company" | "shop" | "master";

/** Canonical production host for each zone. */
export const ZONE_HOSTS: Record<Zone, string> = {
  company: "orizino.com",
  shop: "shop.orizino.com",
  master: "mp.orizino.com",
};

/**
 * Resolve a hostname to its production zone.
 * Returns `null` for any non-production host (Lovable preview, *.lovable.app,
 * localhost, sandbox) so zone enforcement is DISABLED there — the full app
 * stays browsable in the editor/preview/published staging URL.
 */
export function resolveZone(hostname: string | undefined | null): Zone | null {
  if (!hostname) return null;
  const h = hostname.toLowerCase().split(":")[0];
  if (h === "orizino.com" || h === "www.orizino.com") return "company";
  if (h === "shop.orizino.com") return "shop";
  if (h === "mp.orizino.com") return "master";
  return null;
}

/**
 * Paths that are shared across every zone and must never be cross-redirected
 * (each subdomain keeps its own independent auth session).
 */
export function isSharedPath(pathname: string): boolean {
  return (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/")
  );
}

/** Which zone owns a given pathname (excluding the root "/" and shared paths). */
export function zoneForPath(pathname: string): Zone {
  if (pathname === "/origin" || pathname.startsWith("/origin/")) return "master";
  if (
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/news") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/company")
  ) {
    return "company";
  }
  // Everything else (home, shop, cart, checkout, orders, product, etc.)
  return "shop";
}

/** The home path each zone redirects "/" to (relative, same host). */
export function zoneHomePath(zone: Zone): string {
  switch (zone) {
    case "master":
      return "/origin";
    case "shop":
      return "/home";
    case "company":
    default:
      return "/";
  }
}

/** Absolute URL for a path on a given zone's production host. */
export function buildZoneUrl(zone: Zone, pathname: string, search = ""): string {
  return `https://${ZONE_HOSTS[zone]}${pathname}${search}`;
}

/** True for request paths that should bypass zone logic entirely. */
export function isBypassedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_") ||
    pathname.startsWith("/assets/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    // any path that looks like a static file (has an extension)
    /\.[a-z0-9]+$/i.test(pathname)
  );
}
