import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import {
  Add01Icon,
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
import { useWorkspaceStore } from "@/stores/workspace-store";

const globalNavItems = [
  { to: "/settings", label: "General", icon: SlidersHorizontalIcon, exact: true },
  { to: "/settings/providers", label: "Providers", icon: BotIcon },
  { to: "/settings/appearance", label: "Appearance", icon: PaintBrush02Icon },
] as const;

export function SettingsLayout() {
  const matchRoute = useMatchRoute();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const hasWorkspaces = workspaces.length > 0;

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
              <p className="text-sidebar-foreground/70 text-xs">
                Manage global and workspace settings.
              </p>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Global</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {globalNavItems.map((item) => (
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

            <SidebarGroup>
              <SidebarGroupLabel className="justify-between gap-2">
                <span>Workspaces</span>
                <Button size="xs" variant="ghost" render={<Link to="/settings/workspaces/new" />}>
                  <HugeiconsIcon icon={Add01Icon} />
                  <span>New</span>
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {hasWorkspaces ? (
                  <SidebarMenu>
                    {workspaces.map((workspace) => (
                      <SidebarMenuItem key={workspace.id}>
                        <SidebarMenuButton
                          isActive={Boolean(
                            matchRoute({
                              to: "/settings/$workspaceId",
                              params: { workspaceId: workspace.id },
                              fuzzy: true,
                            }),
                          )}
                          render={
                            <Link
                              to="/settings/$workspaceId"
                              params={{ workspaceId: workspace.id }}
                            />
                          }
                        >
                          <HugeiconsIcon icon={SlidersHorizontalIcon} />
                          <span>{workspace.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <p className="px-2 py-1 text-sidebar-foreground/70 text-xs">
                    No workspaces found.
                  </p>
                )}
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
