import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

import { renderErrorPage } from "./lib/error-page";
import {
  resolveZone,
  zoneForPath,
  zoneHomePath,
  buildZoneUrl,
  isSharedPath,
  isBypassedPath,
} from "./lib/zones";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Hostname-based zone routing. Each subdomain (orizino.com / shop.orizino.com /
// mp.orizino.com) is served by this single Worker; this middleware redirects
// requests that don't belong to the current host's zone to the correct
// subdomain. On non-production hosts (preview, *.lovable.app, localhost) the
// resolver returns null and enforcement is skipped, so the full app stays
// browsable in the editor.
const zoneMiddleware = createMiddleware().server(async ({ next }) => {
  let request: Request | undefined;
  try {
    request = getRequest();
  } catch {
    return next();
  }
  if (!request) return next();

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return next();
  }

  const zone = resolveZone(url.hostname);
  if (!zone) return next(); // preview/dev/published staging → no enforcement

  const path = url.pathname;
  if (isBypassedPath(path) || isSharedPath(path)) return next();

  // Root → the zone's canonical home (relative, same host).
  if (path === "/") {
    const home = zoneHomePath(zone);
    if (home === "/") return next(); // company landing renders here
    return new Response(null, {
      status: 307,
      headers: { Location: `${home}${url.search}` },
    });
  }

  // Cross-zone path → redirect to the same path on the owning subdomain.
  const target = zoneForPath(path);
  if (target !== zone) {
    return new Response(null, {
      status: 307,
      headers: { Location: buildZoneUrl(target, path, url.search) },
    });
  }

  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, zoneMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
