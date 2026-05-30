# Route zones (Phase 2 seam)

This directory is the staging area for splitting Orizino into three logical
apps that can later be extracted into a monorepo (Phase 3):

- `zones/docs/` — landing, portfolio, news & updates, product highlights,
  company info. Will become `apps/docs/` (→ `orizino.com`).
- `zones/shop/` — customer storefront: browse, cart, checkout, orders,
  account, support, affiliate, wishlist, CMS pages. Will become
  `apps/storefront/` (→ `shop.orizino.com`).
- `zones/master/` — admin/back-office and section-scoped staff console.
  Will become `apps/master/` (→ `panel.orizino.com`).

Shared building blocks (UI kit, Supabase client, auth, currency, language,
perf hooks, design tokens) live under `src/shared/` and will become
workspace packages (`packages/ui`, `packages/supabase`, `packages/shared`,
`packages/tokens`).

## Path aliases

- `@docs/*` → `src/zones/docs/*`
- `@shop/*` → `src/zones/shop/*`
- `@master/*` → `src/zones/master/*`
- `@shared/*` → `src/shared/*`

These aliases are wired in `tsconfig.json` and picked up by the Vite
`tsConfigPaths` plugin automatically. Use them in new code so future
physical moves become trivial (`mv` + re-point a single alias root).

## Migration order

1. New files land in the correct zone from day one.
2. Storefront pages move first (largest surface, cleanest boundaries).
3. Admin pages move next, in lockstep with section access wiring.
4. Docs/portfolio pages move last; that subset becomes `apps/docs/` in
   Phase 3.
