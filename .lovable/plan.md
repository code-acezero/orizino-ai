# Plan

Items are ordered by your stated priority. Each phase ends in a working, verifiable change so you can stop after any phase.

## Phase 1 — Quick frontend wins (same turn)

**1a. Notification panel "Clear" button**
- Read `NotificationBell.tsx` and find why Clear is a no-op. Most likely: it updates local state but never writes to `notifications` table, or RLS rejects the delete.
- Fix: call `supabase.from('notifications').update({ is_read: true }).eq('user_id', uid)` (mark-all-read) or `.delete()` (true clear) — confirm which one you want; default to mark-all-read so history isn't lost.
- Optimistically update the unread badge.

**1b. og-image probe noise**
- Probe currently GETs `/og-image` with no `slug`, function returns 400 "Missing slug parameter". Switch its probe to `reachability` (OPTIONS preflight) like the others. No backend change needed — the function is healthy, the probe was wrong.

## Phase 2 — Call services + Metered TURN (one focused turn)

**2a. `get-ice-servers` wiring in admin**
- Pull live source of `get-ice-servers` via Supabase to confirm response shape.
- Add a "Test TURN" button in `AdminCallSettings` that:
  - calls `getIceServers()` from `src/lib/ice-servers.ts`
  - renders each server (URL, has-credential, type STUN/TURN/TURNS)
  - runs a real `RTCPeerConnection` ICE gathering check and reports whether a `relay` candidate appears (proves TURN actually works, not just that creds were returned)
- Load Metered config from `site_settings.voice_call_config` (already used by `getIceServers`) and show current `coturn_*` values + last test result.

**2b. `sync-recording-to-drive`**
- This one IS in repo (`src/lib/drive-backup.functions.ts`). I'll:
  - verify `LOVABLE_API_KEY` + `GOOGLE_DRIVE_API_KEY` are present (they are)
  - add a "Sync to Drive" button on each call log row in `AdminCallSettings` / call history that calls `syncRecordingToDrive({ call_log_id })`
  - surface the resulting `drive_file_id` + Drive link in the UI
  - show clear error toast on failure (currently silent)

## Phase 3 — Edge function fixes (pull-and-recreate)

For each of `notify-live-support`, `generate-invoice`, `sync-shipments`, `og-image`:
- Pull the live deployed source via Supabase MCP.
- Diagnose the actual failure from logs (push subscription rows, invoice template, courier API auth, slug routing).
- Decide per-function whether to (a) patch the edge function and redeploy, or (b) migrate to a `createServerFn` in `src/lib/*.functions.ts`.
- Default: migrate to server fn unless the function MUST stay an edge function (e.g. external webhook target with a fixed URL).
- `notify-live-support`: most likely needs a valid push subscription + VAPID keys (both present). Will test with a real admin user_id.

This is the largest phase. I'll do one function per turn so each can be tested in isolation.

## Phase 4 — Admin panel cleanup (final pass)

Goals you stated: remove duplicates, merge related options, wire up disconnected systems, sleeker build.

Approach:
- Audit all 46 `Admin*.tsx` pages + sidebar nav. Output a single consolidation map BEFORE making changes:
  - `AdminCouriers` vs `AdminCourierManagement` — likely merge
  - `AdminEmailCampaigns` / `AdminEmailAutomations` / `AdminEmailTemplates` / `AdminEmailSubscribers` / `AdminEmailProvider` / `AdminEmailCampaignEditor` — group under one "Email" hub with tabs
  - `AdminCustomers` / `AdminCustomerAnalytics` / `AdminUsers` — clarify roles, possibly merge
  - `AdminProfileAppearance` / `AdminStorefrontAppearance` / `AdminAuthAppearance` / `AdminBranding` — group under "Appearance" hub
  - `AdminShipping` / `AdminDeliveryOffers` / `AdminCourierManagement` — group under "Shipping" hub
  - Disconnected systems to wire: TURN test (phase 2), Drive sync (phase 2), Resend webhook status, courier balance display, etc.
- Present the consolidation map for approval, then execute in 1-2 turns.

## Order of execution

I will execute Phase 1 immediately in this turn (both items are small and self-contained), then return for approval on Phase 2.

## Out of scope unless you confirm

- Editing live deployed edge function source for functions not yet in this repo (Phase 3) — needs your OK that overwriting deployed code is fine.
- Deleting admin pages during cleanup — I'll propose the map first, you approve, then I delete.
