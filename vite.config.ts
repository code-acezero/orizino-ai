// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually

// or the app will break with duplicate plugins:

//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),

//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,

//     error logger plugins, and sandbox detection (port/host/strictPort).

// You can pass additional config via defineConfig({ vite: { ... } }) if needed.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";



// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).

// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.

export default defineConfig({

  tanstackStart: {

    server: { entry: "server" },

    // Emit a prerendered SPA shell as index.html so the app can be hosted on
    // any static/edge platform (Netlify, Vercel, Cloudflare Pages). Without it
    // there is no index.html and the SPA fallback in public/_redirects 404s.

    spa: { enabled: true, prerender: { outputPath: "/index" } },

  },

});
