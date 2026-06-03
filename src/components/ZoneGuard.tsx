import * as React from "react";
import { useLocation } from "@tanstack/react-router";
import {
  resolveZone,
  zoneForPath,
  zoneHomePath,
  buildZoneUrl,
  isSharedPath,
  isBypassedPath,
} from "@/lib/zones";

/**
 * Client-side companion to the SSR zone middleware in start.ts.
 * Catches in-app (SPA) navigations that cross zone boundaries and hard-redirects
 * the browser to the correct subdomain. No-ops on non-production hosts
 * (preview / *.lovable.app / localhost) so the editor preview stays unrestricted.
 */
export default function ZoneGuard() {
  const location = useLocation();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const zone = resolveZone(window.location.hostname);
    if (!zone) return;

    const path = location.pathname;
    if (isBypassedPath(path) || isSharedPath(path)) return;

    if (path === "/") {
      const home = zoneHomePath(zone);
      if (home !== "/") {
        window.location.replace(`${home}${window.location.search}`);
      }
      return;
    }

    const target = zoneForPath(path);
    if (target !== zone) {
      window.location.replace(buildZoneUrl(target, path, window.location.search));
    }
  }, [location.pathname]);

  return null;
}
