/**
 * Verifies that a cron request is hitting the expected project host.
 * Returns `null` if valid, or a Response (401) if it's coming through
 * the wrong project URL (prevents accidental cross-project firing
 * after remixes / URL changes).
 */
const EXPECTED_PROJECT_ID = "e108d47f-9d62-4808-9e06-03ac25079d49";

export function validateCronOrigin(request: Request): Response | null {
  try {
    const url = new URL(request.url);
    const host = url.hostname;
    // Allow:
    //  - localhost / 127.0.0.1 (local dev)
    //  - any host containing the expected project id (preview, prod, custom)
    //  - the published apex (synapse-link-kit.lovable.app) — explicit allow-list
    const allowedSuffixes = [
      `project--${EXPECTED_PROJECT_ID}.lovable.app`,
      `project--${EXPECTED_PROJECT_ID}-dev.lovable.app`,
      `id-preview--${EXPECTED_PROJECT_ID}.lovable.app`,
    ];
    const ok =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.includes(EXPECTED_PROJECT_ID) ||
      host === "synapse-link-kit.lovable.app" ||
      allowedSuffixes.some((s) => host === s);
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "cron locked to project", host }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return null;
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
