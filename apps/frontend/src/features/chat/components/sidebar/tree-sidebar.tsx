import { invoke } from "@tauri-apps/api/core";
import {
  Accessor,
  createContext,
  createMemo,
  createResource,
  createSignal,
  For,
  JSX,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import { makePersisted } from "@solid-primitives/storage";
import { navigationStore } from "../../../../stores/navigation.store";

// const WORKSPACE_ID = "w-default";
const WORKSPACE_ID = "workspace-b430f600-e05b-4197-accc-d47870528557";
// "workspace-b430f600-e05b-4197-accc-d47870528557"

// Define proper types for folder and item structures
interface Folder {
  id: string;
  name: string;
  // Add other properties as needed
}

interface Item {
  id: string;
  name: string;
  // Add other properties as needed
}

interface WorkspaceContents {
  folders: Folder[];
  items: Item[];
}

type RefetchMap = Map<string, () => void>;

interface TreeContextInterface {
  openFolders: Accessor<string[]>;
  toggleFolder: (folderId: string) => void;
  refetchMap: RefetchMap;
  registerRefetch: (folderId: string, refetch: () => void) => void;
  triggerRefetch: (folderId: string) => void;
  unregisterRefetch: (folderId: string) => void;
}

const TreeContext = createContext<TreeContextInterface>();

type TreeProviderProps = {
  children: JSX.Element;
};

/**
 * Provider component that manages the tree state and refetch functionality
 * Uses SolidJS signals and context for efficient reactive state management
 */
function TreeProvider(props: TreeProviderProps) {
  // Persist open folders state between sessions
  const [openFolders, setOpenFolders] = makePersisted(
    createSignal<string[]>([]),
    {
      name: `mynth:sidebar:tree:open-folders`,
    }
  );

  // Map to store refetch functions for each folder
  const refetchMap = new Map<string, () => void>();

  // Register a refetch function for a specific folder
  const registerRefetch = (folderId: string, refetch: () => void) => {
    refetchMap.set(folderId, refetch);
  };

  // Trigger refetch for a specific folder
  const triggerRefetch = (folderId: string) => {
    const refetch = refetchMap.get(folderId);
    if (refetch) {
      refetch();
    }
  };

  // Remove refetch function when no longer needed
  const unregisterRefetch = (folderId: string) => {
    refetchMap.delete(folderId);
  };

  // Toggle folder open/closed state
  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  return (
    <TreeContext.Provider
      value={{
        openFolders,
        toggleFolder,
        refetchMap,
        registerRefetch,
        triggerRefetch,
        unregisterRefetch,
      }}
    >
      {props.children}
    </TreeContext.Provider>
  );
}

export function TreeSidebar() {
  return (
    <div class="overflow-auto text-14px px-12px h-full w-full scrollbar scrollbar-track-color-transparent scrollbar-thumb-color-accent/50 scrollbar-rounded scrollbar-w-3px scrollbar-h-3px scrollbar-radius-2 scrollbar-track-radius-4 scrollbar-thumb-radius-4">
      <TreeProvider>
        <TreeNode parentId={null} />
      </TreeProvider>
    </div>
  );
}

type TreeNodeProps = {
  parentId: string | null;
};

/**
 * Component that fetches and renders a tree node's contents
 * Uses SolidJS resources for efficient data loading
 */
function TreeNode(props: TreeNodeProps) {
  const ctx = useContext(TreeContext);

  if (!ctx) {
    throw new Error("TreeNode must be used within a TreeProvider");
  }

  // Use createResource with proper typing
  const [contents, { refetch }] = createResource<WorkspaceContents, string>(
    () => navigationStore.workspace.id,
    async (workspaceId: string) => {
      try {
        const [chats, folders] = await Promise.all([
          invoke<any>("get_chats", {
            workspaceId,
            parentId: props.parentId,
          }),
          invoke<any>("get_chat_folders", {
            workspaceId,
            parentId: props.parentId,
          }),
        ]);

        return {
          folders,
          items: chats,
        };
      } catch (error) {
        console.error("Failed to fetch workspace contents:", error);
        return { folders: [], items: [] };
      }
    }
  );

  // Calculate loading and error states using createMemo for better performance
  const isLoading = createMemo(() => contents.loading);
  const hasError = createMemo(() => contents.error);

  // Register refetch function with cleanup
  if (props.parentId !== null) {
    ctx.registerRefetch(props.parentId, refetch);

    onCleanup(() => {
      if (props.parentId !== null) {
        ctx.unregisterRefetch(props.parentId);
      }
    });
  }

  return (
    <Show when={!hasError() && contents()} keyed>
      {(content: WorkspaceContents) => (
        <TreeNodeContent folders={content.folders} items={content.items} />
      )}
    </Show>
  );
}

type TreeNodeContentProps = {
  folders: Folder[];
  items: Item[];
};

/**
 * Component that renders the contents of a tree node
 */
function TreeNodeContent(props: TreeNodeContentProps) {
  return (
    <div>
      <For each={props.folders}>
        {(folder) => <TreeFolder folder={folder} />}
      </For>
      <For each={props.items}>{(item) => <TreeItem item={item} />}</For>
    </div>
  );
}

type TreeItemProps = {
  item: Item;
};

/**
 * Component that renders a single item in the tree
 */
function TreeItem(props: TreeItemProps) {
  return (
    <button class="text-left flex items-center gap-2 truncate py-2px w-full hover:bg-accent/10 rounded-sm px-1">
      <div class="i-lucide:message-square text-11px" />
      <span class="truncate">{props.item.name}</span>
    </button>
  );
}

type TreeFolderProps = {
  folder: Folder;
};

/**
 * Component that renders a folder in the tree with toggleable contents
 */
function TreeFolder(props: TreeFolderProps) {
  const ctx = useContext(TreeContext);

  if (!ctx) {
    throw new Error("TreeFolder must be used within a TreeProvider");
  }

  // Use createMemo to derive whether the folder is open
  const isOpen = createMemo(() => ctx.openFolders().includes(props.folder.id));

  return (
    <>
      <button
        class="flex items-center gap-2 truncate py-2px w-full hover:bg-accent/10 rounded-sm px-1"
        onClick={() => ctx.toggleFolder(props.folder.id)}
      >
        <div
          class="text-11px"
          classList={{
            "i-lucide:folder": !isOpen(),
            "i-lucide:folder-open": isOpen(),
          }}
        />
        <span class="truncate">{props.folder.name}</span>
      </button>
      <Show when={isOpen()}>
        <div class="pl-8px ml-4px my-2px border-l-accent/10 border-l-solid border-l-1px">
          <TreeNode parentId={props.folder.id} />
        </div>
      </Show>
    </>
  );
}
