import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import {
  ArrowLeft01Icon,
  BotIcon,
  PaintBrush02Icon,
  SlidersHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { WindowChrome } from "@/components/app/window-chrome";
import { Button } from "@/components/ui/button";
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
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { to: "/settings", label: "General", icon: SlidersHorizontalIcon, exact: true },
  { to: "/settings/providers", label: "Providers", icon: BotIcon },
  { to: "/settings/appearance", label: "Appearance", icon: PaintBrush02Icon },
] as const;

export function SettingsLayout() {
  const matchRoute = useMatchRoute();

  return (
    <WindowChrome
      toolbar={
        <div className="flex w-full items-center justify-between gap-3">
          <Button size="sm" variant="ghost" render={<Link to="/chat" />}>
            <HugeiconsIcon icon={ArrowLeft01Icon} />
            <span>Chat</span>
          </Button>
          <div className="font-heading text-sm font-semibold tracking-tight">Settings</div>
          <div className="w-14" />
        </div>
      }
      contentClassName="overflow-hidden"
    >
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="none" className="border-r">
          <SidebarHeader>
            <div className="space-y-1 px-2 py-1">
              <p className="font-medium text-sm">Configuration</p>
              <p className="text-sidebar-foreground/70 text-xs">Manage app settings.</p>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Sections</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={Boolean(
                          matchRoute({
                            to: item.to,
                            fuzzy: !("exact" in item),
                          }),
                        )}
                        render={<Link to={item.to} activeOptions={{ exact: "exact" in item }} />}
                      >
                        <HugeiconsIcon icon={item.icon} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </WindowChrome>
  );
}
