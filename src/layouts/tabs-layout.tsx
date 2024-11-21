import { Component, createMemo, For } from "solid-js";
import { useTabsManager } from "../lib/tabs-manager/hooks/use-tabs-manager";
import XIcon from "../components/icons/x";
import { A, useLocation } from "@solidjs/router";
import { Button } from "../components/ui/button";
import PlusIcon from "../components/icons/plus";

type Props = {
  children: Component;
};

export default function TabsLayout(props: Props) {
  return (
    <>
      <div class="flex items-center justify-between px-2 py-2">
        {/* Tabs */}
        <Tabs />

        {/* Tabs Controls */}
        <TabsControls />
      </div>
      {props.children}
    </>
  );
}

function Tabs() {
  const location = useLocation();
  const pathname = createMemo(() => location.pathname);

  const { tabs, closeTab } = useTabsManager();

  return (
    <nav class="flex flex-1 items-center gap-1 h-10 overflow-y-scroll">
      <For each={Array.from(tabs().values())}>
        {(tab) => (
          <div
            class="h-10 flex whitespace-nowrap items-center overflow-clip w-60 rounded-lg"
            classList={{
              "bg-white/5": pathname() === tab.path,
            }}
            onAuxClick={(e) => {
              e.preventDefault();
              closeTab(tab.path);
            }}
          >
            <A
              href={tab.path}
              class="flex flex-0 items-center pl-3 w-full text-ellipsis h-full"
            >
              {tab.title}
            </A>
            <button
              onClick={() => {
                closeTab(tab.path);
              }}
              class="text-foreground flex-1 px-4 h-full hover:bg-white/5"
            >
              <XIcon size={12} />
            </button>
          </div>
        )}
      </For>
    </nav>
  );
}

function TabsControls() {
  const { openEmptyTab } = useTabsManager();

  return (
    <div>
      <Button onClick={() => openEmptyTab()} size="icon">
        <PlusIcon />
      </Button>
    </div>
  );
}
