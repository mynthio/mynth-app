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
  const { tabs, remove } = useTabsManager();

  return (
    <nav class="flex items-center gap-1 h-10" q>
      <For each={tabs()}>
        {(tab) => (
          <div
            class="h-10 flex items-center overflow-hidden w-60 rounded-lg"
            classList={{
              "bg-white/5": pathname() === tab.key,
            }}
          >
            <A href={tab.key} class="flex-0 pl-3 w-full">
              {tab.title}
            </A>
            <button
              onClick={() => {
                remove(tab.key);
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
  const { add: push } = useTabsManager();

  return (
    <div>
      <Button
        onClick={() => push({ path: "/tabs/1", title: "Home", data: {} })}
        size="icon"
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
