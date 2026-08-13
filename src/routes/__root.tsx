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
        <style>{`
          @media (max-width: 768px) {
            .bottom-navigation {
              color: #eef4ff !important;
              border-block-start: 1px solid rgba(255,255,255,.12) !important;
              background: linear-gradient(135deg,#0a1a3a 0%,#122859 52%,#0a1a3a 100%) !important;
              box-shadow: 0 -10px 28px rgba(5,13,32,.28) !important;
            }
            .bottom-navigation__item { color: rgba(255,255,255,.78) !important; }
            .bottom-navigation__item.active,
            .bottom-navigation__item[aria-current="page"] { color: #fff !important; }
            .bottom-navigation__item.active .bottom-navigation__indicator,
            .bottom-navigation__item[aria-current="page"] .bottom-navigation__indicator,
            .bottom-navigation__item.primary .bottom-navigation__indicator {
              color: #0a1a3a !important;
              background: #e6c878 !important;
            }
            .bottom-navigation__item.primary .bottom-navigation__indicator {
              border-color: #0a1a3a !important;
              box-shadow: 0 8px 18px rgba(0,0,0,.3) !important;
            }
            .bottom-navigation__item:active,
            .bottom-navigation__item:hover {
              color: #fff !important;
              background: rgba(255,255,255,.08) !important;
            }
          }
          .receipt-selector-page { width:min(100%,920px); margin:0 auto; padding:clamp(18px,4vw,36px) 0 80px; }
          .receipt-selector-heading { text-align:center; margin-bottom:24px; }
          .receipt-selector-kicker { display:inline-flex; padding:7px 12px; border-radius:999px; background:#eef3ff; color:#122859; font-weight:800; font-size:.82rem; margin-bottom:10px; }
          .receipt-selector-heading p { margin:-10px 0 0; color:#6b7388; }
          .receipt-selector-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
          .receipt-type-card { min-width:0; min-height:260px; display:flex; flex-direction:column; align-items:flex-start; justify-content:space-between; gap:20px; padding:clamp(22px,4vw,30px); border-radius:22px; text-decoration:none; border:1px solid #dfe5f0; box-shadow:0 14px 36px -20px rgba(10,26,58,.35); transition:transform 180ms ease,box-shadow 180ms ease,border-color 180ms ease; overflow:hidden; position:relative; }
          .receipt-type-card--iraq { color:#fff; background:linear-gradient(145deg,#0a1a3a 0%,#18356f 100%); border-color:rgba(230,200,120,.45); }
          .receipt-type-card--turkey { color:#fff; background:linear-gradient(145deg,#122859 0%,#244995 100%); border-color:rgba(230,200,120,.36); }
          .receipt-type-card:hover { transform:translateY(-4px); border-color:#e6c878; box-shadow:0 24px 48px -20px rgba(10,26,58,.45); }
          .receipt-type-icon { width:62px; height:62px; display:grid; place-items:center; border-radius:18px; background:#e6c878; color:#0a1a3a; box-shadow:0 10px 24px rgba(0,0,0,.2); }
          .receipt-type-icon svg { width:31px; height:31px; }
          .receipt-type-copy { display:grid; gap:8px; }
          .receipt-type-copy strong { font-size:clamp(1.3rem,4vw,1.65rem); font-weight:900; }
          .receipt-type-copy small { color:rgba(255,255,255,.8); font-size:.9rem; line-height:1.8; }
          .receipt-type-action { display:inline-flex; padding:10px 14px; border-radius:12px; background:rgba(255,255,255,.1); color:#fff; font-weight:800; font-size:.88rem; }
          @media (max-width:700px) { .receipt-selector-grid { grid-template-columns:1fr; } .receipt-type-card { min-height:220px; } }
        `}</style>
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
              <Link to="/wasl-select">اعمل وصل</Link>
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
        <MobileLink to="/wasl-select" icon={Plus} label="وصل" primary />
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
