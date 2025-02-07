import "./../index.css";

import { getCurrentWindow } from "@tauri-apps/api/window";
import TabsManagerKeyboardShortcuts from "../lib/tabs-manager/utils/tabs-manager-keyboard-shortcuts";
import { animate, stagger } from "motion";
import { createResource, For, Match, onMount, Show, Switch } from "solid-js";
import { useSelector } from "@xstate/store/solid";
import { tabsManager } from "../lib/tabs-manager/tabs-manager.store";
import { ChatsTree } from "../components/sidebar/chats-tree/chats-tree";

import { sidebarManager } from "../lib/sidebar-manager/sidebar-manager.store";
import SidebarManagerKeyboardShortcuts from "../lib/sidebar-manager/sidebar-keyboard-shortcuts";
import { useCurrentChatId } from "../hooks/use-current-chat-id.hook";
import { OverlayScrollbarsComponent } from "overlayscrollbars-solid";
import AiIntegrations from "../components/sidebar/ai-integrations/ai-integrations";
import {
  BlocksIcon,
  BoltIcon,
  BotIcon,
  FolderTreeIcon,
  GitBranchIcon,
  ListTreeIcon,
  Maximize2Icon,
  MessagesSquareIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  ZapIcon,
} from "lucide-solid";
import {
  sidebarState,
  toggleSidebarComponent,
} from "../stores/sidebar/sidebar-store";
import { invoke } from "@tauri-apps/api/core";
import { openModal, setOpenModal } from "../stores/modals.store";
import { ModalsRouter } from "../components/modals-router";
import { viewManager } from "../stores/view-manager.store";

type Props = any;

const window = getCurrentWindow();

export default function RootLayout(props: Props) {
  const isSidebarOpen = useSelector(
    sidebarManager,
    (state) => state.context.isOpen
  );
  if (!isSidebarOpen()) return null;

  return (
    <div class="h-full w-full flex">
      {/* <WindowTopBar /> */}
      <WindowSideNavigation />

      <Show when={sidebarState.open}>
        <Sidebar />
      </Show>

      <div class="w-full h-full">
        <div class="h-full w-full flex flex-col bg-[#0D0E0E]/90 min-w-0">
          <TabsBar />
          <OverlayScrollbarsComponent
            defer
            class="h-full w-full min-w-0"
            options={{
              scrollbars: {
                theme: "os-theme-light",
                autoHide: "scroll",
              },
            }}
          >
            <main class="h-full">{props.children}</main>
          </OverlayScrollbarsComponent>
        </div>
      </div>

      <ModalsRouter />

      <TabsManagerKeyboardShortcuts />
      <SidebarManagerKeyboardShortcuts />
    </div>
  );
}

function TabsBar() {
  const tabs = useSelector(tabsManager, (state) => state.context.tabs);
  const activeTab = useSelector(
    tabsManager,
    (state) => state.context.activeTab
  );

  return (
    <div
      class="h-topbar-height min-h-topbar-height max-h-topbar-height flex-1 w-full gap-[2px] flex min-w-0 items-center  px-space-1"
      data-tauri-drag-region
    >
      <For each={Array.from(tabs().values())}>
        {(tab) => (
          <div
            class="h-[calc(var(--spacing-topbar-height)-var(--spacing-space-2))] w-full max-w-[180px] min-w-0 break-keep whitespace-nowrap flex-nowrap gap-[3px] justify-between text-white/60 flex items-center font-light text-[12px] rounded-md"
            classList={{
              "bg-[#9fadbd]/5": tab.id === activeTab(),
              "text-white/80": tab.id === activeTab(),
            }}
            onAuxClick={() => {
              tabsManager.send({
                type: "closeTab",
                id: tab.id,
              });
            }}
          >
            <button
              class="pl-3 cursor-pointer min-w-0 h-full flex-1 w-full max-w-full truncate text-left"
              onClick={() => {
                tabsManager.send({
                  type: "setActiveTab",
                  id: tab.id,
                });
              }}
            >
              {tab.title}
            </button>
            <button
              class="h-[20px] w-[20px] min-w-[20px] mr-[4px] rounded-sm flex items-center justify-center cursor-pointer hover:bg-white/5"
              onClick={() => {
                tabsManager.send({ type: "closeTab", id: tab.id });
              }}
            >
              <XIcon size={10} />
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

function Sidebar() {
  return (
    <aside class="w-sidebar-width flex-grow-0 flex-shrink-0 h-full text-[#a2a2a2] text-[14px] font-light px-2 motion-preset-slide-right">
      <Switch fallback={<ChatsSidebarContent />}>
        <Match when={sidebarState.component === "chats"}>
          <ChatsSidebarContent />
        </Match>
        <Match when={sidebarState.component === "workspace"}>
          <WorkspaceSidebarContent />
        </Match>
        <Match when={sidebarState.component === "ai_integrations"}>
          <AiIntegrationsSidebarContent />
        </Match>
        <Match when={sidebarState.component === "settings"}>
          <SettingsSidebarContent />
        </Match>
      </Switch>
    </aside>
  );
}

function ChatsSidebarContent() {
  const [chats] = createResource(async () => {
    const chats = await invoke("fetch_chats", {
      workspaceId: null,
    });

    return chats;
  });

  return (
    <div class="h-full w-full flex flex-col">
      <div
        class="h-topbar-height flex flex-1 min-h-topbar-height max-h-topbar-height items-center justify-between px-2"
        data-tauri-drag-region
      >
        <span class="uppercase text-[10px] font-normal text-[#a2a2a2]">
          Quick chats
        </span>

        <div class="flex items-center gap-[7px]">
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <PlusIcon size={10} />
          </button>
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <SearchIcon size={10} />
          </button>
        </div>
      </div>

      <OverlayScrollbarsComponent
        defer
        class="h-full"
        options={{
          scrollbars: {
            theme: "os-theme-light",
            autoHide: "scroll",
          },
        }}
      >
        <For each={chats() as any[]}>
          {(chat) => (
            <button class="w-full px-[6px] my-[2px] py-[2px] text-[14px] rounded-[5px] flex items-center gap-[4px] hover:bg-[#eaf3ec]/5">
              <MessagesSquareIcon size={10} />
              {chat.name}
            </button>
          )}
        </For>
      </OverlayScrollbarsComponent>
    </div>
  );
}

function WorkspaceSidebarContent() {
  return (
    <div class="h-full w-full flex flex-col">
      <div
        class="h-topbar-height flex flex-1 min-h-topbar-height max-h-topbar-height items-center justify-between px-2"
        data-tauri-drag-region
      >
        <span class="uppercase text-[10px] font-normal text-[#a2a2a2]">
          my workspace
        </span>

        <div class="flex items-center gap-[7px]">
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <PlusIcon size={10} />
          </button>
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <SearchIcon size={10} />
          </button>
        </div>
      </div>

      <OverlayScrollbarsComponent
        defer
        class="h-full"
        options={{
          scrollbars: {
            theme: "os-theme-light",
            autoHide: "scroll",
          },
        }}
      >
        <ChatsTree />
      </OverlayScrollbarsComponent>
    </div>
  );
}

function SettingsSidebarContent() {
  return (
    <>
      <div
        class="h-topbar-height flex items-center justify-between px-2"
        data-tauri-drag-region
      >
        <span class="uppercase text-[10px] font-normal text-[#a2a2a2]">
          Settings
        </span>
      </div>

      <div>
        <button
          class="flex items-center gap-1 px-2 py-0.5 rounded-sm hover:bg-stone-500/10 w-full"
          onClick={() => {
            sidebarManager.send({
              type: "open",
              content: "settings",
            });

            tabsManager.send({
              type: "openTab",
              id: "settings",
              title: "Settings",
              component: "settings-app_settings",
            });
          }}
        >
          <BoltIcon size={10} />
          App Settings
        </button>

        <button
          class="flex items-center gap-1 px-2 py-0.5 rounded-sm hover:bg-stone-500/10 w-full"
          onClick={() => {
            sidebarManager.send({
              type: "open",
              content: "settings",
            });

            tabsManager.send({
              type: "openTab",
              id: "settings",
              title: "Settings - AI Integrations",
              component: "settings-ai_integrations",
            });
          }}
        >
          <BlocksIcon size={10} />
          AI Integrations
        </button>
      </div>
    </>
  );
}

function AiIntegrationsSidebarContent() {
  return (
    <>
      <div
        class="h-topbar-height flex items-center justify-between px-2"
        data-tauri-drag-region
      >
        <span class="uppercase text-[10px] font-normal text-[#a2a2a2]">
          AI Integrations
        </span>

        <div class="flex items-center gap-[7px]">
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <PlusIcon width={10} height={10} />
          </button>
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <SearchIcon width={10} height={10} />
          </button>
        </div>
      </div>

      <OverlayScrollbarsComponent
        defer
        class="h-full"
        options={{
          scrollbars: {
            theme: "os-theme-light",
            autoHide: "scroll",
          },
        }}
      >
        <AiIntegrations />
      </OverlayScrollbarsComponent>
    </>
  );
}

function ChatSideNav() {
  onMount(() => {
    animate(
      ".chat-side-nav-item",
      {
        y: [-10, 0],
        opacity: [0, 1],
      },
      {
        delay: stagger(0.1),
      }
    );
  });

  return (
    <div class="flex flex-col items-center justify-center gap-[2px]">
      <hr class="chat-side-nav-item h-[1px] my-[2px] bg-white/[0.07] w-full border-0 border-none" />

      <button class="chat-side-nav-item rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center">
        <BotIcon width={16} height={16} />
      </button>

      <button class="chat-side-nav-item rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center">
        <GitBranchIcon width={16} height={16} />
      </button>
    </div>
  );
}

function WindowSideNavigation() {
  const currentChatId = useCurrentChatId();

  return (
    <div
      class="w-window-side-nav-width flex-grow-0 flex-shrink-0 relative h-full grid grid-cols-1 grid-rows-[var(--spacing-topbar-height)_1fr] after:content-[''] after:absolute after:top-[10px] after:right-0 after:w-[1px] after:bottom-[10px] after:z-10"
      classList={{
        "after:bg-white/[0.07]": sidebarState.open,
      }}
    >
      <div class="flex items-center justify-center gap-[6px] w-full group relative">
        <button
          onClick={() => {
            window.close();
          }}
          class="bg-[#FF5F57] w-[9px] h-[9px] rounded-full flex items-center justify-center z-[9999999999999] "
        >
          <XIcon size={6} class="text-[#FF5F57] group-hover:text-stone-700" />
        </button>
        <button
          onClick={() => {
            window.minimize();
          }}
          class="bg-[#FDBC2C] w-[9px] h-[9px] rounded-full flex items-center justify-center z-[9999999999999]"
        >
          <MinusIcon
            size={6}
            class="text-[#FDBC2C] group-hover:text-stone-700"
          />
        </button>
        <button
          onClick={() => {
            window.toggleMaximize();
          }}
          class="bg-[#28C840] w-[9px] h-[9px] rounded-full flex items-center justify-center z-[9999999999999]"
        >
          <Maximize2Icon
            size={6}
            class="text-[#28C840] group-hover:text-stone-700"
          />
        </button>
      </div>

      <div
        class="flex flex-col w-full justify-between items-center h-full flex-0"
        data-tauri-drag-region
      >
        <div class="flex flex-col gap-[3px]">
          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            classList={{
              "bg-[#eaf3ec]/5":
                sidebarState.component === "chats" && sidebarState.open,
            }}
            onClick={() => {
              toggleSidebarComponent("chats");
            }}
          >
            <MessagesSquareIcon size={16} />
          </button>

          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            classList={{
              "bg-[#eaf3ec]/5":
                sidebarState.component === "workspace" && sidebarState.open,
            }}
            onClick={() => {
              toggleSidebarComponent("workspace");
            }}
          >
            <ListTreeIcon size={16} />
          </button>

          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            classList={{
              "bg-white/5":
                sidebarState.component === "ai_integrations" &&
                sidebarState.open,
            }}
            onClick={() => {
              toggleSidebarComponent("ai_integrations");
            }}
          >
            <BlocksIcon size={16} />
          </button>

          {currentChatId() && <ChatSideNav />}
        </div>

        <div class="flex flex-col gap-1 mb-[15px]">
          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            onClick={() => viewManager.setView("settings")}
          >
            <BoltIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
