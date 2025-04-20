import { invoke } from "@tauri-apps/api/core";
import { createResource } from "solid-js";
import {
  navigationStore,
  setNavigationStore,
} from "../../../../stores/navigation.store";
import { openContextMenu } from "../../../context-menu";
import { useChats } from "../../../../data/queries/chats/use-chats";
import { push } from "../../../tabs/tabs.store";

export function ActivitySidebar() {
  const chats = useChats({
    workspaceId: () => navigationStore.workspace.id,
  });

  return (
    <div class="overflow-auto h-full w-full scrollbar-app">
      <Group title={""} items={chats.data ?? []} />
    </div>
  );
}

type GroupProps = {
  title: string;
  items: any[];
};

function Group(props: GroupProps) {
  return (
    <div class="flex flex-col">
      <div class="text-ui text-accent/50">{props.title}</div>
      <div class="flex flex-col">
        {props.items.map((item) => (
          <Item item={item} />
        ))}
      </div>
    </div>
  );
}

type ItemProps = {
  item: any;
};

function Item(props: ItemProps) {
  return (
    <button
      onContextMenu={openContextMenu("chat", {
        id: props.item.id,
      })}
      class="text-left transition-duration-200ms transition-colors font-light bg-accent/0 flex items-center gap-2 text-ui truncate h-32px hover:text-white/95 rounded-default cursor-default transition-all duration-500"
      onClick={(e) => {
        setNavigationStore("content", {
          id: props.item.id,
          type: "chat",
        });

        push({
          id: props.item.id as string,
          type: "chat" as const,
          state: "idle",
          title: props.item.name as string,
          data: {
            chatId: props.item.id as string,
          },
        });
      }}
    >
      <div class="i-lucide:message-circle text-ui-icon flex-shrink-0" />
      <span class="truncate">{props.item.name}</span>
    </button>
  );
}
