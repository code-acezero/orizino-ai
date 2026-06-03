import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from "react";

import appCss from "../styles.css?url";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import SiteThemeProvider from "@/components/SiteThemeProvider";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/NotFound";
import ZoneGuard from "@/components/ZoneGuard";

const SplashScreen = React.lazy(() => import("@/components/SplashScreen"));
const AIChatWidget = React.lazy(() => import("@/components/AIChatWidget"));
const PromoPopup = React.lazy(() => import("@/components/PromoPopup"));

const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Orizino" },
      { name: "description", content: "orizino — premium & luxurious fashion brand" },
      { property: "og:site_name", content: "Orizino" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:title", content: "Orizino" },
      { name: "twitter:title", content: "Orizino" },
      { property: "og:description", content: "orizino — premium & luxurious fashion brand" },
      { name: "twitter:description", content: "orizino — premium & luxurious fashion brand" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/707043ee-fc59-409d-b97b-46adf360ec19" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/707043ee-fc59-409d-b97b-46adf360ec19" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      ...(SUPABASE_ORIGIN
        ? [
            { rel: "preconnect", href: SUPABASE_ORIGIN, crossOrigin: "anonymous" as const },
            { rel: "dns-prefetch", href: SUPABASE_ORIGIN },
          ]
        : []),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => {
    console.error(error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <a href="/" className="mt-4 inline-block text-primary underline">
            Go home
          </a>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  useDynamicFavicon();
  return null;
}

function useSplash() {
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, []);
  return show;
}

function ClientShell() {
  const splash = useSplash();
  return (
    <>
      <React.Suspense fallback={null}>
        <SplashScreen visible={splash} />
      </React.Suspense>
      <SiteThemeProvider />
      <AppContent />
      <React.Suspense fallback={null}>
        <AIChatWidget />
        <PromoPopup />
      </React.Suspense>
      <Outlet />
      <Toaster />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <LayoutProvider>
                <ClientShell />
              </LayoutProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
