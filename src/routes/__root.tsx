import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ChartNoAxesCombined, Home, Plus, ReceiptText, Users, type LucideIcon } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
const ghadeerLogo = { url: "/ghadeer-logo.png" };

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة إلى الرئيسية
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">تعذّر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            العودة إلى الرئيسية
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "شركة الغدير للنقل والتخليص الكمركي" },
      {
        name: "description",
        content: "منصة شركة الغدير لإدارة العملاء والوصولات والحسابات والعمليات اللوجستية.",
      },
      { property: "og:title", content: "شركة الغدير للنقل والتخليص الكمركي" },
      {
        property: "og:description",
        content: "منصة متكاملة لإدارة عمليات شركة الغدير وحساباتها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "شركة الغدير للنقل والتخليص الكمركي" },
      {
        name: "twitter:description",
        content: "منصة متكاملة لإدارة عمليات شركة الغدير وحساباتها.",
      },
      {
        property: "og:image",
        content: "/ghadeer-logo.png",
      },
      {
        name: "twitter:image",
        content: "/ghadeer-logo.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap",
      },
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
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

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
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link
          to="/"
          className="brand"
          style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
        >
          <img src={ghadeerLogo.url} alt="شعار الغدير" />
          <div
            className="brand-name"
            style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}
          >
            <span>شركة الغدير</span>
            <small>GHADEER LOGISTICS</small>
          </div>
        </Link>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <ul className="top-navigation">
            <li>
              <Link to="/" activeOptions={{ exact: true }}>
                الرئيسية
              </Link>
            </li>
            <li>
              <Link to="/wasl">اعمل وصل</Link>
            </li>
            <li>
              <Link to="/customers">العملاء</Link>
            </li>
            <li>
              <Link to="/receipts">السندات</Link>
            </li>
            <li>
              <Link to="/expenses">المصروفات</Link>
            </li>
            <li>
              <Link to="/accounts">الحسابات</Link>
            </li>
            <li>
              <Link to="/reports">التقارير</Link>
            </li>
            <li>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
              >
                خروج
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        📍 زاخو – إبراهيم الخليل &nbsp;•&nbsp; 📞 07504084359 &nbsp;•&nbsp; 📧 starzeki001@gmail.com
        <br />© 2026 شركة الغدير للنقل والتخليص الكمركي – جميع الحقوق محفوظة
      </footer>
      <nav className="bottom-navigation" aria-label="التنقل السفلي">
        <MobileLink to="/" icon={Home} label="الرئيسية" />
        <MobileLink to="/customers" icon={Users} label="العملاء" />
        <MobileLink to="/wasl" icon={Plus} label="وصل" primary />
        <MobileLink to="/receipts" icon={ReceiptText} label="السندات" />
        <MobileLink to="/reports" icon={ChartNoAxesCombined} label="التقارير" />
      </nav>
    </div>
  );
}

function MobileLink({
  to,
  icon: Icon,
  label,
  primary = false,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "active", "aria-current": "page" }}
      className={`bottom-navigation__item${primary ? " primary" : ""}`}
    >
      <span className="bottom-navigation__indicator" aria-hidden="true">
        <Icon strokeWidth={2.2} />
      </span>
      <small>{label}</small>
    </Link>
  );
}
