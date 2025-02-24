import {
  createMemo,
  createSignal,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { TauriFlatItem } from "../../../interfaces/tauri/chat";
import { FolderIcon, FolderOpenIcon, MessagesSquareIcon } from "lucide-solid";
import { makePersisted } from "@solid-primitives/storage";
import { debounce } from "@solid-primitives/scheduled";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui/context-menu";
import { tabsManager } from "../../../lib/tabs-manager/tabs-manager.store";
import { useCurrentChatId } from "../../../hooks/use-current-chat-id.hook";
import { cn } from "../../../lib/utils";

interface FlatTreeNode {
  id: string;
  name: string;
  type: "folder" | "chat";
  isOpen: boolean;
  parentId: string | null;
}

const [flatTree, setFlatTree] = createSignal<FlatTreeNode[]>([]);

const changeParent = (id: string, newParentId: string | null) => {
  if (id.startsWith("chat")) {
    invoke("update_chat", {
      chatId: id,
      params: {
        parentId: newParentId,
      },
    }).then((res) => console.log("update_chat", res));
  } else {
    invoke("update_chat_folder", {
      folderId: id,
      params: {
        parentId: newParentId,
      },
    }).then((res) => console.log("update_chat_folder", res));
  }

  setFlatTree((state) =>
    state.map((node) => ({
      ...node,
      parentId: node.id === id ? newParentId : node.parentId,
    }))
  );
};

const [openedFolders, setOpenedFolders] = makePersisted(
  createSignal<string[]>([]),
  {
    name: "opened-folders",
  }
);

const handleOpenFolder = (id: string) =>
  setOpenedFolders((state) => [...new Set([...state, id])]);

const handleCloseFolder = (id: string) =>
  setOpenedFolders((state) => state.filter((x) => x !== id));

export function ChatsTree() {
  onMount(async () => {
    const flatTree = (await invoke("get_flat_structure", {
      workspaceId: "w-default",
    })) as TauriFlatItem[];

    setFlatTree(
      flatTree.map((node) => ({
        ...node,
        isOpen: openedFolders().includes(node.id),
      }))
    );
  });

  const topLevelList = createMemo(() =>
    flatTree().filter((node) => node.parentId === null)
  );

  return <For each={topLevelList()}>{(node) => <TreeNode node={node} />}</For>;
}

function TreeNode(props: { node: FlatTreeNode }) {
  return (
    <Switch>
      <Match when={props.node.type === "folder"}>
        <FolderNode node={props.node} />
      </Match>

      <Match when={props.node.type === "chat"}>
        <ChatNode node={props.node} />
      </Match>
    </Switch>
  );
}

function FolderNode(props: { node: FlatTreeNode }) {
  const [isHovering, setIsHovering] = createSignal(false);
  const isOpen = () => openedFolders().includes(props.node.id);
  const children = createMemo(() =>
    flatTree().filter((node) => node.parentId === props.node.id)
  );
  const openFolderOnHover = debounce(() => {
    if (isHovering()) {
      handleOpenFolder(props.node.id);
    }
  }, 700);

  let draggableRef: HTMLElement | undefined = undefined;
  let dropTargetRef: HTMLElement | undefined = undefined;

  onMount(() => {
    const cleanup = combine(
      draggable({
        element: draggableRef!,
        getInitialData: () => ({
          id: props.node.id,
        }),
      }),
      dropTargetForElements({
        element: dropTargetRef!,
        getData: () => ({
          id: props.node.id,
        }),
        onDragEnter: ({ location }) => {
          if (location.current.dropTargets[0]?.data.id === props.node.id) {
            setIsHovering(true);
            openFolderOnHover();
          } else {
            setIsHovering(false);
          }
        },
        onDragLeave: () => {
          setIsHovering(false);
        },
        onDropTargetChange: ({ location }) => {
          if (location.current.dropTargets[0]?.data.id === props.node.id) {
            setIsHovering(true);
            openFolderOnHover();
          } else {
            setIsHovering(false);
          }
        },
        onDrop: ({ source, location }) => {
          setIsHovering(false);

          /**
           * Prevent setting a parent to child folder
           */
          if (
            location.current.dropTargets.some(
              (x) =>
                x.data.id === source.data.id && !x.data.id.startsWith("chat")
            )
          ) {
            return;
          }

          if (source.data.id !== props.node.id) {
            changeParent(source.data.id as string, props.node.id);
          }
        },
      })
    );

    onCleanup(() => cleanup());
  });

  return (
    <div
      class="rounded-[4px]"
      ref={dropTargetRef}
      classList={{
        "bg-[#eaf3ec]/5": isHovering(),
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger
          ref={draggableRef}
          onClick={() => {
            if (isOpen()) {
              handleCloseFolder(props.node.id);
            } else {
              handleOpenFolder(props.node.id);
            }
          }}
          class="w-full px-[6px] my-[2px] py-[2px] text-[14px] rounded-[5px] flex items-center gap-[4px] hover:bg-[#eaf3ec]/5"
        >
          {isOpen() ? <FolderOpenIcon size={10} /> : <FolderIcon size={10} />}
          {props.node.name}
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem value="new-chat">New chat</ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              changeParent(props.node.id, null);
            }}
            value="move-to-root"
          >
            Move to root
          </ContextMenuItem>
        </ContextMenuContent>

        <Show when={isOpen()}>
          <div class={cn("relative ml-[14px]")}>
            <For
              fallback={
                <div>
                  <i>Empty folder</i>
                </div>
              }
              each={children()}
            >
              {(node) => <TreeNode node={node} />}
            </For>
          </div>
        </Show>
      </ContextMenu>
    </div>
  );
}

function ChatNode(props: { node: FlatTreeNode }) {
  let draggableRef: HTMLElement | undefined = undefined;
  const currentChatId = useCurrentChatId();

  onMount(() => {
    const cleanup = draggable({
      element: draggableRef!,
      getInitialData: () => ({
        id: props.node.id,
      }),
    });

    onCleanup(() => cleanup());
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger
        ref={draggableRef}
        onClick={() => {
          tabsManager.send({
            type: "openTab",
            id: `chat-${props.node.id}`,
            title: props.node.name,
            component: "chat",
          });
        }}
        class="w-full my-[2px] px-[6px] py-[2px] text-[14px] rounded-[5px] flex items-center gap-[4px] hover:bg-[#eaf3ec]/5"
        classList={{
          "bg-[#eaf3ec]/5": currentChatId() === props.node.id,
        }}
      >
        <MessagesSquareIcon size={10} />
        {props.node.name}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => changeParent(props.node.id, null)}
          value="move-to-root"
        >
          Move to root
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
