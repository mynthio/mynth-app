import { invoke } from "@tauri-apps/api/core";
import {
  Accessor,
  createContext,
  createResource,
  createSignal,
  Setter,
  useContext,
} from "solid-js";
import {
  navigationStore,
  setNavigationStore,
} from "../../../../stores/navigation.store";
import { openContextMenu } from "../../../context-menu";
import { useChats } from "../../../../data/queries/chats/use-chats";
import { push } from "../../../tabs/tabs.store";
import { createShortcut } from "@solid-primitives/keyboard";
import { openActionDialog } from "../../../actions";

const ChatSelectContext = createContext<{
  selected: Accessor<string[]>;
  setSelected: Setter<string[]>;
}>({
  selected: () => [],
  setSelected: () => {},
});

const useChatSelect = () => {
  return useContext(ChatSelectContext);
};

export function ActivitySidebar() {
  const chats = useChats({
    workspaceId: () => navigationStore.workspace.id,
  });

  const [selected, setSelected] = createSignal<string[]>([]);

  createShortcut(["Meta", "Backspace"], () => {
    if (selected().length === 1) {
      openActionDialog("delete-chat", {
        chatId: selected()[0],
      });
    } else if (selected().length > 0) {
      openActionDialog("bulk-delete-chats", {
        chatIds: selected(),
      });
    }
  });

  return (
    <ChatSelectContext.Provider value={{ selected, setSelected }}>
      <div class="overflow-auto h-full w-full scrollbar-app">
        <Group title={""} items={chats.data ?? []} />
      </div>
    </ChatSelectContext.Provider>
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
  const { selected, setSelected } = useChatSelect();

  return (
    <button
      onContextMenu={openContextMenu("chat", {
        id: props.item.id,
      })}
      classList={{
        "bg-elements-background-soft text-selected": selected().includes(
          props.item.id
        ),
      }}
      class="
      px-12px 
      text-left transition-colors flex items-center gap-2 text-muted
      text-ui truncate h-32px rounded-default cursor-default 
      transition-all duration-250"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          // Meta key is pressed (Cmd on Mac, Ctrl on Windows)
          // Toggle selection for this item
          if (selected().includes(props.item.id)) {
            // If already selected, remove from selection
            setSelected((state) => state.filter((id) => id !== props.item.id));
          } else {
            // If not selected, add to selection
            setSelected((state) => [...state, props.item.id]);
          }
        } else {
          // Normal click - clear selection and select only this item
          setSelected([props.item.id]);

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
        }
      }}
    >
      <div class="i-lucide:message-circle text-ui-icon flex-shrink-0" />
      <span class="truncate">{props.item.name}</span>
    </button>
  );
}
