import { MacOsWindowControls } from "../components/macos/macos-window-controls";
import { ActionsDialog } from "../features/actions/actions-dialog";
import { ContextMenuContainer } from "../features/context-menu/context-menu-container";
import { appConfig } from "../stores/app-config.store";
import { navigationStore } from "../stores/navigation.store";
import { Content } from "./content/content";
import { Sidebar } from "./components/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import mynthLogo from "../assets/mynth-logo.png";
import { Tabs } from "../features/tabs/tabs";
import { TabsKbdShortcuts } from "../features/tabs/tabs-kbd-shortcuts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

/**
 * App Layout
 *
 * This is the main layout for the app.
 *
 * The structure looks like this:
 *
 * | NavigationSidebar | Sidebar (collapsable) | Content |
 */
export default function AppLayout() {
  return (
    <QueryClientProvider client={client}>
      <div class="size-full flex flex-col gap-5px">
        <TopBar />
        <div class="flex w-full h-full flex-1 gap-5px">
          <Sidebar />
          <Content />
        </div>
      </div>
      <ActionsDialog />
      <ContextMenuContainer />
      <SolidQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function TopBar() {
  return (
    <div class="flex items-center gap-5px">
      <div
        class="h-top-bar flex items-center gap-16px flex-shrink-0"
        classList={{
          "w-sidebar": navigationStore.sidebar.isOpen,
        }}
      >
        {appConfig.window.showTrafficLights ? (
          <MacOsWindowControls />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button class="w-button h-button flex-shrink-0 flex items-center justify-center cursor-default">
                <img
                  draggable={false}
                  src={mynthLogo}
                  class="w-36px pointer-events-none select-none animate-in animate-fade-in"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Switch to traffic lights</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Minimize</DropdownMenuItem>
              <DropdownMenuItem>Maximize</DropdownMenuItem>
              <DropdownMenuItem>Fullscreen</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Quit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div class="flex items-center gap-5px w-full">
          <Show
            when={navigationStore.sidebar.isOpen}
            fallback={
              <button class="rounded-default bg-window-elements-background h-button w-button flex items-center justify-center">
                <div class="i-lucide:search text-ui-icon text-muted" />
              </button>
            }
          >
            <div class="rounded-default bg-window-elements-background h-button w-full flex-1 flex items-center text-muted text-ui-small px-16px">
              Search
            </div>
          </Show>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button class="rounded-default bg-window-elements-background h-button w-button flex items-center justify-center">
                <div class="i-lucide:plus text-ui-icon text-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  invoke("create_chat", {
                    name: "New chat",
                    workspaceId: "w-default",
                  });
                }}
              >
                New chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs />
      <TabsKbdShortcuts />
    </div>
  );
}
