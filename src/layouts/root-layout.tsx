import "./../index.css";

import { getCurrentWindow } from "@tauri-apps/api/window";
import TabsManagerKeyboardShortcuts from "../lib/tabs-manager/utils/tabs-manager-keyboard-shortcuts";
import { animate, delay, scroll, stagger } from "motion";
import {
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import XIcon from "../components/icons/x";
import PlusIcon from "../components/icons/plus";
import IconPhSidebar from "~icons/ph/sidebar";
import IconPhCaretDown from "~icons/ph/caret-down";
import { useSelector } from "@xstate/store/solid";
import { tabsManager } from "../lib/tabs-manager/tabs-manager.store";
import { buildChatTree } from "../lib/chats-manager/utils/build-chat-tree.util";
import { invoke } from "@tauri-apps/api/core";
import { chatsTreeStore } from "../lib/chats-manager/chats-tree.store";
import {
  TauriChatFolder,
  TauriChatListItem,
  TauriFlatItem,
} from "../interfaces/tauri/chat";
import { ChatTree } from "../components/sidebar/chats-tree/chats-tree";
import IconPhPlusCircle from "~icons/ph/plus-circle";
import IconChatsCircle from "~icons/ph/chats-circle";
import IconStack from "~icons/ph/stack";
import IconGear from "~icons/ph/gear";
import IconPlus from "~icons/ph/plus";
import IconBrain from "~icons/ph/brain";
import IconX from "~icons/ph/x";
import IconGitBranch from "~icons/ph/git-branch";
import IconMagnifyingGlass from "~icons/ph/magnifying-glass";
import { sidebarManager } from "../lib/sidebar-manager/sidebar-manager.store";
import SidebarManagerKeyboardShortcuts from "../lib/sidebar-manager/sidebar-keyboard-shortcuts";
import { useCurrentChatId } from "../hooks/use-current-chat-id.hook";
import { OverlayScrollbarsComponent } from "overlayscrollbars-solid";
import AiIntegrations from "../components/sidebar/ai-integrations/ai-integrations";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../components/ui/context-menu";

type Props = any;

const window = getCurrentWindow();

export default function RootLayout(props: Props) {
  onMount(async () => {
    console.log("mounting");

    const flatTree = (await invoke("get_flat_structure")) as TauriFlatItem[];

    const openFoldersFromStorage = localStorage.getItem(
      "mynth:chats-tree:open-folders"
    );

    const openeFolders = openFoldersFromStorage
      ? new Set(openFoldersFromStorage.split(",").map((x) => Number(x)))
      : null;

    chatsTreeStore.on("open-folders", (event) => {
      console.log("toggle folder", event.ids);
      localStorage.setItem(
        "mynth:chats-tree:open-folders",
        event.ids.join(",")
      );
    });

    chatsTreeStore.send({
      type: "setup",
      tree: flatTree,
      openFolders: openeFolders,
    });
  });

  const isSidebarOpen = useSelector(
    sidebarManager,
    (state) => state.context.isOpen
  );
  if (!isSidebarOpen()) return null;

  return (
    <div class="h-full w-full flex">
      {/* <WindowTopBar /> */}
      <WindowSideNavigation />

      <Show when={isSidebarOpen()}>
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
              <IconX width={10} height={10} />
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

function Sidebar() {
  const content = useSelector(sidebarManager, (state) => state.context.content);

  return (
    <aside class="w-sidebar-width flex-grow-0 flex-shrink-0 h-full text-[#a2a2a2] text-[14px] font-light px-2 motion-preset-slide-right">
      <Switch fallback={<ChatsSidebarContent />}>
        <Match when={content() === "chats"}>
          <ChatsSidebarContent />
        </Match>
        <Match when={content() === "ai_integrations"}>
          <AiIntegrationsSidebarContent />
        </Match>
        <Match when={content() === "settings"}>
          <SettingsSidebarContent />
        </Match>
      </Switch>
    </aside>
  );
}

function ChatsSidebarContent() {
  const title = (
    <span class="uppercase text-[10px] font-normal text-[#a2a2a2]">
      my workspace
    </span>
  );

  animate(
    title!,
    {
      y: [-5, 0],
      opacity: [0, 1],
    },
    {
      type: "spring",
      stiffness: 100,
      damping: 10,
      duration: 0.35,
    }
  );

  // const chatsTree = (
  //   <div class="h-full w-full" id="chats-tree">
  //     <ChatTree />
  //   </div>
  // );

  // const buttonsInTree = document.querySelectorAll("#chats-tree button");

  // animate(
  //   buttonsInTree,
  //   {
  //     y: [-10, 0],
  //   },
  //   { type: "spring", stiffness: 300, duration: 300 }
  // );

  return (
    <div class="h-full w-full flex flex-col">
      <div
        class="h-topbar-height flex flex-1 min-h-topbar-height max-h-topbar-height items-center justify-between px-2"
        data-tauri-drag-region
      >
        {title}

        <div class="flex items-center gap-[7px]">
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <IconPlus width={10} height={10} />
          </button>
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <IconMagnifyingGlass width={10} height={10} />
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
        <ChatTree />
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
          <IconGear width={10} height={10} />
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
          <IconStack width={10} height={10} />
          AI Integrations
        </button>
      </div>
    </>
  );
}

function AiIntegrationsSidebarContent() {
  const [aiIntegrations] = createResource(async () => {
    const integrations = await invoke("get_ai_integrations");
    return integrations;
  });

  const [ollamaTestData] = createResource(async () => {
    const data = await fetch("http://localhost:11434/api/tags").then((res) =>
      res.json()
    );
    return data;
  });

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
            <IconPlus width={10} height={10} />
          </button>
          <button class="cursor-pointer h-[15px] w-[15px]  items-center justify-center flex">
            <IconMagnifyingGlass width={10} height={10} />
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
        <IconBrain width={16} height={16} />
      </button>

      <button class="chat-side-nav-item rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center">
        <IconGitBranch width={16} height={16} />
      </button>
    </div>
  );
}

function WindowSideNavigation() {
  const currentChatId = useCurrentChatId();

  const sidebarContent = useSelector(
    sidebarManager,
    (state) => state.context.content
  );

  const isSidebarOpen = useSelector(
    sidebarManager,
    (state) => state.context.isOpen
  );

  return (
    <div
      class="w-window-side-nav-width flex-grow-0 flex-shrink-0 relative h-full grid grid-cols-1 grid-rows-[var(--spacing-topbar-height)_1fr] after:content-[''] after:absolute after:top-[10px] after:right-0 after:w-[1px] after:bottom-[10px] after:z-10"
      classList={{
        "after:bg-white/[0.07]": isSidebarOpen(),
      }}
    >
      <div class="flex items-center justify-center gap-[6px] w-full">
        <button
          onClick={() => {
            window.close();
          }}
          class="bg-[#FF5F57] w-[9px] h-[9px] rounded-full"
        ></button>
        <button
          onClick={() => {
            window.minimize();
          }}
          class="bg-[#FDBC2C] w-[9px] h-[9px] rounded-full"
        ></button>
        <button
          onClick={() => {
            window.toggleMaximize();
          }}
          class="bg-[#28C840] w-[9px] h-[9px] rounded-full"
        ></button>
      </div>

      <div
        class="flex flex-col w-full justify-between items-center h-full flex-0"
        data-tauri-drag-region
      >
        <div class="flex flex-col gap-[3px]">
          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            classList={{
              "bg-[#eaf3ec]/5": sidebarContent() === "chats" && isSidebarOpen(),
            }}
            onClick={() => {
              sidebarManager.send({
                type: "toggle",
                content: "chats",
              });
            }}
          >
            <IconChatsCircle width={16} height={16} />
          </button>

          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            classList={{
              "bg-white/5":
                sidebarContent() === "ai_integrations" && isSidebarOpen(),
            }}
            onClick={() => {
              sidebarManager.send({
                type: "toggle",
                content: "ai_integrations",
              });
            }}
          >
            <IconStack width={16} height={16} />
          </button>

          {currentChatId() && <ChatSideNav />}
        </div>

        <div class="flex flex-col gap-1 mb-[15px]">
          <button
            class="rounded-md cursor-pointer hover:bg-white/5 text-[#a2a2a2] w-[36px] h-[36px] flex items-center justify-center"
            onClick={() => {
              sidebarManager.send({
                type: "toggle",
                content: "settings",
              });
            }}
          >
            <IconGear width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
