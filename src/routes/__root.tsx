import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import ghadeerLogo from "../assets/ghadeer-logo.png.asset.json";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "منصة المنتج المحلي - الهيئة العامة للكمارك" },
      { name: "description", content: "نظام إصدار وثائق المنتج المحلي والتحقق منها للهيئة العامة للكمارك" },
      { property: "og:title", content: "منصة المنتج المحلي - الهيئة العامة للكمارك" },
      { property: "og:description", content: "نظام إصدار وثائق المنتج المحلي والتحقق منها للهيئة العامة للكمارك" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "منصة المنتج المحلي - الهيئة العامة للكمارك" },
      { name: "twitter:description", content: "نظام إصدار وثائق المنتج المحلي والتحقق منها للهيئة العامة للكمارك" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/caab6747-7df1-4139-a8a4-11017c5c4cd0/id-preview-c1f17de8--2250d21d-4d82-4c08-ab9b-ebff3185882c.lovable.app-1781624255039.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/caab6747-7df1-4139-a8a4-11017c5c4cd0/id-preview-c1f17de8--2250d21d-4d82-4c08-ab9b-ebff3185882c.lovable.app-1781624255039.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SiteShell>
        <Outlet />
      </SiteShell>
      <Toaster richColors position="top-center" dir="rtl" />
    </QueryClientProvider>
  );
}

function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" className="brand" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img src={ghadeerLogo.url} alt="شعار الغدير" />
          <div className="brand-name" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span>شركة الغدير</span>
            <small>GHADEER LOGISTICS</small>
          </div>
        </Link>
        <nav style={{ position: "relative" }}>
          <ul style={{ listStyle: "none", display: "flex", margin: 0, padding: 0 }}>
            <li><Link to="/">الرئيسية</Link></li>
            <li><Link to="/wasl">اعمل وصل</Link></li>
          </ul>
          <button
            type="button"
            className="menu-toggle"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            aria-label="القائمة"
          >☰</button>
          {menuOpen && (
            <div className="mobile-menu open" onClick={close}>
              <Link to="/" onClick={close} style={{ display: "block" }}>🏠 الرئيسية</Link>
              <Link to="/wasl" onClick={close} style={{ display: "block" }}>📄 اعمل وصل</Link>
            </div>
          )}
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer>
        📍 زاخو – إبراهيم الخليل &nbsp;•&nbsp; 📞 07504084359 &nbsp;•&nbsp; 📧 starzeki001@gmail.com
        <br />© 2026 شركة الغدير للنقل والتخليص الكمركي – جميع الحقوق محفوظة
      </footer>
      <style>{`
        nav ul li { list-style: none; }
        .menu-toggle { display: none; }
        .mobile-menu { display: none; position: absolute; top: 100%; left: 0; right: 0; min-width: 220px; padding: 8px; z-index: 1000; }
        .mobile-menu.open { display: block; }
        @media (max-width: 768px) {
          nav > ul { display: none !important; }
          .menu-toggle { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}
