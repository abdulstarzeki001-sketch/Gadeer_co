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
import { useEffect, useState, type ReactNode } from "react";
import { ChartNoAxesCombined, Home, Moon, Plus, ReceiptText, Sun, Users, type LucideIcon } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
const ghadeerLogo = { url: "/ghadeer-logo.png" };

type GhadeerTheme = "dark" | "legacy";

const ENGLISH_NUMERALS_SCRIPT = `
(() => {
  const latinLocale = "ar-IQ-u-nu-latn";
  const originalNumber = Number.prototype.toLocaleString;
  const originalDate = Date.prototype.toLocaleString;
  const originalDateOnly = Date.prototype.toLocaleDateString;
  const originalTimeOnly = Date.prototype.toLocaleTimeString;
  Number.prototype.toLocaleString = function (_locales, options) {
    return originalNumber.call(this, latinLocale, options);
  };
  Date.prototype.toLocaleString = function (_locales, options) {
    return originalDate.call(this, latinLocale, options);
  };
  Date.prototype.toLocaleDateString = function (_locales, options) {
    return originalDateOnly.call(this, latinLocale, options);
  };
  Date.prototype.toLocaleTimeString = function (_locales, options) {
    return originalTimeOnly.call(this, latinLocale, options);
  };
})();
`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">العودة إلى الرئيسية</Link></div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">تعذّر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">إعادة المحاولة</button><a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">العودة إلى الرئيسية</a></div>
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
      { name: "theme-color", content: "#03112b" },
      { name: "application-name", content: "الغدير" },
      { name: "description", content: "منصة شركة الغدير لإدارة العملاء والوصولات والحسابات والعمليات اللوجستية." },
      { property: "og:title", content: "شركة الغدير للنقل والتخليص الكمركي" },
      { property: "og:description", content: "منصة متكاملة لإدارة عمليات شركة الغدير وحساباتها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "شركة الغدير للنقل والتخليص الكمركي" },
      { name: "twitter:description", content: "منصة متكاملة لإدارة عمليات شركة الغدير وحساباتها." },
      { property: "og:image", content: "/ghadeer-logo.png" },
      { name: "twitter:image", content: "/ghadeer-logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "/ghadeer-dark-theme.css" },
      { rel: "stylesheet", href: "/ghadeer-readable-theme.css" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "apple-touch-icon", href: "/ghadeer-logo.png" },
      { rel: "icon", href: "/ghadeer-logo.png", type: "image/png" },
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
    <html lang="ar-IQ-u-nu-latn" dir="rtl">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: ENGLISH_NUMERALS_SCRIPT }} />
        <style>{`html,body,#root,input,select,textarea,button,table{font-variant-numeric:lining-nums tabular-nums}`}</style>
      </head>
      <body>{children}<Scripts /></body>
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
  return <QueryClientProvider client={queryClient}><SiteShell><Outlet /></SiteShell><Toaster richColors position="top-center" dir="rtl" /></QueryClientProvider>;
}

function SiteShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<GhadeerTheme>("dark");
  const applyTheme = (nextTheme: GhadeerTheme) => {
    const darkThemeLink = document.querySelector<HTMLLinkElement>('link[href="/ghadeer-dark-theme.css"]');
    if (darkThemeLink) darkThemeLink.disabled = nextTheme === "legacy";
    document.documentElement.dataset.ghadeerTheme = nextTheme;
  };
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ghadeer-theme");
    const initialTheme: GhadeerTheme = savedTheme === "legacy" ? "legacy" : "dark";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);
  const changeTheme = (nextTheme: GhadeerTheme) => {
    setTheme(nextTheme);
    window.localStorage.setItem("ghadeer-theme", nextTheme);
    applyTheme(nextTheme);
  };
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}><img src={ghadeerLogo.url} alt="شعار الغدير" /><div className="brand-name" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}><span>شركة الغدير</span><small>GHADEER LOGISTICS</small></div></Link>
        <div aria-label="اختيار الثيم" style={{ display: "flex", alignItems: "center", gap: 6, marginInline: "auto 12px" }}>
          <button type="button" onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"} aria-label="الوضع الداكن" title="الوضع الداكن" style={{ width: 38, height: 38, display: "grid", placeItems: "center", padding: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,.28)", background: theme === "dark" ? "#e6c878" : "rgba(255,255,255,.08)", color: theme === "dark" ? "#0a1a3a" : "#fff", cursor: "pointer" }}><Moon size={19} strokeWidth={2.3} aria-hidden="true" /></button>
          <button type="button" onClick={() => changeTheme("legacy")} aria-pressed={theme === "legacy"} aria-label="الوضع النهاري" title="الوضع النهاري" style={{ width: 38, height: 38, display: "grid", placeItems: "center", padding: 0, borderRadius: 12, border: "1px solid rgba(255,255,255,.28)", background: theme === "legacy" ? "#e6c878" : "rgba(255,255,255,.08)", color: theme === "legacy" ? "#0a1a3a" : "#fff", cursor: "pointer" }}><Sun size={19} strokeWidth={2.3} aria-hidden="true" /></button>
        </div>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي"><ul className="top-navigation"><li><Link to="/" activeOptions={{ exact: true }}>الرئيسية</Link></li><li><Link to="/wasl-select">اعمل وصل</Link></li><li><Link to="/customers">العملاء</Link></li><li><Link to="/receipts">السندات</Link></li><li><Link to="/expenses">المصروفات</Link></li><li><Link to="/accounts">الحسابات</Link></li><li><Link to="/reports">التقارير</Link></li><li><button type="button" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>خروج</button></li></ul></nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">📍 زاخو – إبراهيم الخليل &nbsp;•&nbsp; 📞 07504084359 &nbsp;•&nbsp; 📧 starzeki001@gmail.com<br />© 2026 شركة الغدير للنقل والتخليص الكمركي – جميع الحقوق محفوظة</footer>
      <nav className="bottom-navigation" aria-label="التنقل السفلي"><MobileLink to="/" icon={Home} label="الرئيسية" /><MobileLink to="/customers" icon={Users} label="العملاء" /><MobileLink to="/wasl-select" icon={Plus} label="وصل" primary /><MobileLink to="/receipts" icon={ReceiptText} label="السندات" /><MobileLink to="/reports" icon={ChartNoAxesCombined} label="التقارير" /></nav>
    </div>
  );
}

function MobileLink({ to, icon: Icon, label, primary = false }: { to: string; icon: LucideIcon; label: string; primary?: boolean }) {
  return <Link to={to} activeOptions={{ exact: to === "/" }} activeProps={{ className: "active", "aria-current": "page" }} className={`bottom-navigation__item${primary ? " primary" : ""}`}><span className="bottom-navigation__indicator" aria-hidden="true"><Icon strokeWidth={2.2} /></span><small>{label}</small></Link>;
}
