import { A, useLocation } from "@solidjs/router";
import "./../index.css";

import { TabsManagerProvider } from "../lib/tabs-manager/context/tabs-manager-context";
import { useTabsManager } from "../lib/tabs-manager/hooks/use-tabs-manager";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TabsManagerKeyboardShortcuts from "../lib/tabs-manager/utils/tabs-manager-keyboard-shortcuts";
import { For } from "solid-js";
import { createMemo } from "solid-js";
import XIcon from "../components/icons/x";
import PlusIcon from "../components/icons/plus";
type Props = any;

const window = getCurrentWindow();

export default function RootLayout(props: Props) {
  return (
    <>
      <TabsManagerProvider value={""}>
        <WindowSidebar />

        <main class="h-full">{props.children}</main>

        <TabsManagerKeyboardShortcuts />
      </TabsManagerProvider>
    </>
  );
}

function WindowSidebar() {
  const { openTab } = useTabsManager();

  return (
    <div
      data-tauri-drag-region
      class="bg-primary h-[35px] flex justify-between items-center gap-4 px-4 py-1"
    >
      {/* MacOS Icons */}
      <div class="flex items-center justify-center gap-2">
        <button
          onClick={() => {
            window.close();
          }}
          class="bg-[#FF5F57] w-2.5 h-2.5 rounded-full"
        ></button>
        <button
          onClick={() => {
            window.minimize();
          }}
          class="bg-[#FDBC2C] w-2.5 h-2.5 rounded-full"
        ></button>
        <button
          onClick={() => {
            window.toggleMaximize();
          }}
          class="bg-[#28C840] w-2.5 h-2.5 rounded-full"
        ></button>
      </div>

      <Tabs />
    </div>
  );
}

function Tabs() {
  const location = useLocation();
  const pathname = createMemo(() => location.pathname);

  const { tabs, closeTab, openEmptyTab } = useTabsManager();

  return (
    <nav
      data-tauri-drag-region
      class="flex flex-1 h-full items-center w-auto gap-1 overflow-y-scroll"
    >
      <For each={Array.from(tabs().values())}>
        {(tab) => (
          <div
            class="h-full flex whitespace-nowrap items-center overflow-clip w-52 rounded-lg"
            classList={{
              "bg-secondary": pathname() === tab.path,
            }}
            onAuxClick={(e) => {
              e.preventDefault();
              closeTab(tab.path);
            }}
          >
            <A
              href={tab.path}
              class="flex flex-0 text-xs text-foreground/50 items-center pl-3 w-full text-ellipsis h-full"
            >
              {tab.title}
            </A>
            <button
              onClick={() => {
                closeTab(tab.path);
              }}
              class="text-foreground flex-1 px-2 h-full hover:bg-white/5"
            >
              <XIcon size={10} />
            </button>
          </div>
        )}
      </For>
      <button
        onClick={() => openEmptyTab()}
        class="flex-0 w-4 h-4 rounded-lg hover:bg-secondary"
      >
        <PlusIcon size={10} />
      </button>
    </nav>
  );
}
