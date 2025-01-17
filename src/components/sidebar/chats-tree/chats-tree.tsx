import { ChatTreeItemType } from "../../../lib/chats-manager/enums/chat-tree-item-type.enum";
import { ChatTreeChat } from "../../../lib/chats-manager/types/chat-tree-chat.type";
import { ChatTreeFolder } from "../../../lib/chats-manager/types/chat-tree-folder.type";

import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  onCleanup,
  onMount,
  Switch,
} from "solid-js";
import { ChatTree as ChatTreeType } from "../../../lib/chats-manager/types/chat-tree.type";
import { useSelector } from "@xstate/store/solid";
import { chatsTreeStore } from "../../../lib/chats-manager/chats-tree.store";

import { tabsManager } from "../../../lib/tabs-manager/tabs-manager.store";
import { Editable } from "@ark-ui/solid/editable";
import { invoke } from "@tauri-apps/api/core";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui/context-menu";
import { dialogStore } from "../../../lib/dialogs/dialogs.store";
import { useCurrentChatId } from "../../../hooks/use-current-chat-id.hook";
import { FolderIcon, FolderOpenIcon, MessagesSquareIcon } from "lucide-solid";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  TauriChatFolder,
  TauriChatListItem,
  TauriFlatItem,
} from "../../../interfaces/tauri/chat";
import { chatsTreeOpen, toggleFolder } from "./chats-tree-open.store";

function ChatTree() {
  // createEffect(() => {
  //   console.log(chatsTreeOpen());
  // });
  const tree = useSelector(chatsTreeStore, (state) => state.context.tree);

  return (
    <>
      <Branch
        parentId={null}
        nodes={tree().filter((item) => item.parentId === null)}
      />
    </>
  );
}

type BranchProps = {
  nodes: TauriFlatItem[];
  parentId: string | null;
};

function Branch(props: BranchProps) {
  return (
    <For each={props.nodes} fallback={null}>
      {(node) => (
        <div class={props.parentId === null ? "pl-0" : "pl-2"}>
          <Switch fallback={"..."}>
            <Match when={node.type === "folder"}>
              <FolderNode node={node as TauriChatFolder} />
            </Match>
            <Match when={node.type === "chat"}>
              <ChatNode node={node as TauriChatListItem} />
            </Match>
          </Switch>
        </div>
      )}
    </For>
  );
}

type FolderNodeProps = {
  node: TauriChatFolder;
};

function FolderNode(props: FolderNodeProps) {
  let refDraggable: HTMLElement | undefined = undefined;
  let refDropTarget: HTMLElement | undefined = undefined;

  const tree = useSelector(chatsTreeStore, (state) => state.context.tree);

  const [isHovering, setIsHovering] = createSignal(false);
  const [isOpen, setIsOpen] = createSignal(props.node.isOpen);
  // const isOpen = createMemo(() => {
  //   console.log("Memo for ", props.node.id);
  //   return chatsTreeOpen()[props.node.id];
  // });

  let openOnHoverTimeout = 0;

  onMount(() => {
    console.log("Mounted for ", props.node.id);

    const cleanup = combine(
      draggable({
        element: refDraggable!,
      }),
      dropTargetForElements({
        element: refDropTarget!,
        getData: () => ({
          id: String(props.node.id),
        }),
        onDragEnter: ({ location, self }) => {
          if (location.current.dropTargets[0]?.data.id === self.data.id) {
            setIsHovering(true);
            openOnHoverTimeout = setTimeout(() => {
              chatsTreeStore.send({
                type: "openFolder",
                id: props.node.id,
              });
              setIsOpen(true);
            }, 870);
          } else {
            setIsHovering(false);
            clearTimeout(openOnHoverTimeout);
          }
        },
        onDragStart: ({ location, self }) => {
          if (location.current.dropTargets[0]?.data.id === self.data.id) {
            setIsHovering(true);
            openOnHoverTimeout = setTimeout(() => {
              chatsTreeStore.send({
                type: "openFolder",
                id: props.node.id,
              });
              setIsOpen(true);
            }, 870);
          } else {
            setIsHovering(false);
            clearTimeout(openOnHoverTimeout);
          }
        },
        onDragLeave: () => {
          setIsHovering(false);
          clearTimeout(openOnHoverTimeout);
        },
        onDropTargetChange: ({ location, self }) => {
          console.log("drop target change", location.current.dropTargets);
          if (location.current.dropTargets[0]?.data.id === self.data.id) {
            setIsHovering(true);
            openOnHoverTimeout = setTimeout(() => {
              chatsTreeStore.send({
                type: "openFolder",
                id: props.node.id,
              });
              setIsOpen(true);
            }, 870);
          } else {
            setIsHovering(false);
            clearTimeout(openOnHoverTimeout);
          }
        },
        onDrop: ({ location, self, source }) => {
          setIsHovering(false);
          clearTimeout(openOnHoverTimeout);
        },
      })
    );

    onCleanup(() => {
      clearTimeout(openOnHoverTimeout);
      cleanup();
    });
  });

  return (
    <div
      ref={refDropTarget}
      classList={{
        "bg-emerald-500/5": isHovering(),
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger
          ref={refDraggable}
          class="chat-tree-node flex items-center gap-1 px-2 py-0.5 rounded-sm hover:bg-stone-500/10 w-full"
          onClick={() => {
            // toggleFolder(props.node.id);

            chatsTreeStore.send({
              type: "toggleFolder",
              id: props.node.id,
            });
          }}
        >
          {isOpen() ? <FolderOpenIcon size={10} /> : <FolderIcon size={10} />}

          <Editable.Root
            onValueCommit={async ({ value }) => {
              console.log(value);
              await invoke("update_chat_folder_name", {
                folderId: props.node.id,
                newName: value,
              });
            }}
            class="w-full text-left"
            autoResize
            value={props.node.name}
            placeholder="Placeholder"
            activationMode="dblclick"
          >
            <Editable.Area class="w-full">
              <Editable.Input class="w-full" />
              <Editable.Preview />
            </Editable.Area>
          </Editable.Root>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem value="new-chat">New chat</ContextMenuItem>
          <ContextMenuItem value="new-folder">New folder</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {isOpen() && (
        <Branch
          parentId={props.node.id}
          nodes={tree().filter((n) => n.parentId === props.node.id)}
        />
      )}
    </div>
  );
}

type ChatNodeProps = {
  node: TauriChatListItem;
};

function ChatNode({ node }: ChatNodeProps) {
  const activeChatId = useCurrentChatId();

  const onClick = () => {
    tabsManager.send({
      type: "addTab",
      id: `chat-${node.id}`,
      title: node.name,
      chatId: node.id.toString(),
    });
  };

  let ref: HTMLElement | undefined = undefined;

  onMount(() => {
    const cleanup = draggable({
      element: ref!,
    });

    onCleanup(() => {
      cleanup();
    });
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger
        ref={ref}
        class="chat-tree-node flex items-center gap-1 px-2 py-0.5 rounded-sm hover:bg-stone-500/10 w-full"
        classList={{
          "bg-stone-500/5": activeChatId() === node.id.toString(),
        }}
        onClick={onClick}
      >
        <MessagesSquareIcon size={10} />
        <Editable.Root
          onValueCommit={async ({ value }) => {
            console.log(value);
            await invoke("update_chat_name", {
              chatId: node.id,
              newName: value,
            });
          }}
          class="w-full text-left"
          autoResize
          value={node.name}
          placeholder="Placeholder"
          activationMode="dblclick"
        >
          <Editable.Area class="w-full">
            <Editable.Input class="w-full" />
            <Editable.Preview />
          </Editable.Area>
        </Editable.Root>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem value="rename">Rename</ContextMenuItem>
        <ContextMenuItem
          value="delete"
          onClick={() =>
            dialogStore.send({
              type: "open",
              dialog: "delete-chat",
              props: {
                chatId: node.id,
              },
            })
          }
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export { ChatTree };
