import { invoke } from "@tauri-apps/api/core";
import { createResource } from "solid-js";
import {
  navigationStore,
  setNavigationStore,
} from "../../../../stores/navigation.store";
import { openContextMenu } from "../../../context-menu";

export function ActivitySidebar() {
  const [chats] = createResource(
    () => navigationStore.workspace.id,
    async (workspaceId) => {
      return invoke("get_chats", {
        workspaceId,
      });
    }
  );

  return (
    <div
      onContextMenu={openContextMenu("chat", {
        id: "id",
      })}
      class="overflow-auto space-y-12px px-4px text-14px h-full w-full scrollbar scrollbar-track-color-transparent scrollbar-thumb-color-accent/50 scrollbar-rounded scrollbar-w-3px scrollbar-h-3px scrollbar-radius-2 scrollbar-track-radius-4 scrollbar-thumb-radius-4"
    >
      <Group title={""} items={chats() ?? []} />
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
      <div class="text-12px text-accent/50">{props.title}</div>
      <div class="flex flex-col gap-1px">
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
      onContextMenu={openContextMenu("item", {
        id: props.item.id,
      })}
      class="text-left transition-duration-200ms transition-colors bg-accent/0 flex items-center gap-2 truncate px-8px py-4px hover:bg-accent/5 rounded-6px"
      classList={{
        "bg-accent/5 text-active": props.item.id === navigationStore.content.id,
        "text-muted": props.item.id !== navigationStore.content.id,
      }}
      onClick={(e) => {
        setNavigationStore("content", {
          id: props.item.id,
          type: "chat",
        });
      }}
    >
      <div class="i-lucide:message-circle text-10px flex-shrink-0" />
      <span class="truncate">{props.item.name}</span>
    </button>
  );
}
