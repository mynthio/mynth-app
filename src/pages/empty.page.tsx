import {
  createMemo,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { TauriChatListItem, TauriFlatItem } from "../interfaces/tauri/chat";
import { TauriChatFolder } from "../interfaces/tauri/chat";
import { makePersisted } from "@solid-primitives/storage";

interface FlatTreeNode {
  id: string;
  name: string;
  type: "folder" | "chat";
  isOpen: boolean;
  parentId: string | null;
}

const [flatTree, setFlatTree] = createSignal<FlatTreeNode[]>([]);
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

export default function EmptyPage() {
  onMount(async () => {
    const flatTree = (await invoke("get_flat_structure")) as TauriFlatItem[];
    setFlatTree(
      flatTree.map((node) => ({
        ...node,
        isOpen: openedFolders().includes(node.id),
      }))
    );
  });

  return <For each={flatTree()}>{(node) => <TreeNode node={node} />}</For>;
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
  const [isOpen, setIsOpen] = createSignal(props.node.isOpen);
  const children = createMemo(() =>
    flatTree().filter((node) => node.parentId === props.node.id)
  );

  return (
    <div>
      <button
        class="p-2 rounded-md bg-gray-900"
        onClick={() => {
          if (isOpen()) {
            handleCloseFolder(props.node.id);
          } else {
            handleOpenFolder(props.node.id);
          }
          setIsOpen(!isOpen());
        }}
      >
        {props.node.name}
      </button>

      <Show when={isOpen()}>
        <div class="ml-2">
          <For fallback={<div>No content</div>} each={children()}>
            {(node) => <TreeNode node={node} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

function ChatNode(props: { node: FlatTreeNode }) {
  return <div>{props.node.name}</div>;
}
