import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, FileText, Plus, Wallet, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const items = [
  { title: "اللوحة الرئيسية", url: "/" as const, icon: LayoutDashboard },
  { title: "الشركات", url: "/companies" as const, icon: Building2 },
  { title: "الوثائق", url: "/documents" as const, icon: FileText },
  { title: "إنشاء وثيقة", url: "/documents/new" as const, icon: Plus },
  { title: "المحاسبة", url: "/accounting" as const, icon: Wallet },
  { title: "التحقق من وثيقة", url: "/verify" as const, icon: ShieldCheck },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar side="right">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-sidebar-primary" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-sidebar-foreground">الكمارك العراقية</div>
            <div className="text-[11px] text-sidebar-foreground/70">منصة المنتج المحلي</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = location.pathname === it.url || (it.url !== "/" && location.pathname.startsWith(it.url));
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url}>
                        <it.icon className="h-4 w-4" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>تسجيل خروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}