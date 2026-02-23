import { create } from "zustand";

import "../lib/electron-api";
import type { ChatTreeChildrenSlice } from "../../shared/ipc";

export const ROOT_CHAT_TREE_PARENT_KEY = "root";

const TREE_STATE_PERSIST_DEBOUNCE_MS = 250;

type ParentKey = string;

function toParentKey(parentFolderId: string | null): ParentKey {
  return parentFolderId === null ? ROOT_CHAT_TREE_PARENT_KEY : parentFolderId;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown error";
}

function normalizeExpandedFolderIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort((left, right) => left.localeCompare(right));
}

function expandedFolderIdsSignature(ids: readonly string[]): string {
  return ids.join("\n");
}

function createEmptyWorkspaceTreeState(): WorkspaceChatTreeState {
  return {
    initialized: false,
    initializing: false,
    expandedFolderIds: [],
    childrenByParentKey: {},
    loadingParentKeys: {},
    errorByParentKey: {},
  };
}

const persistTimersByWorkspaceId = new Map<string, ReturnType<typeof setTimeout>>();

export interface WorkspaceChatTreeState {
  initialized: boolean;
  initializing: boolean;
  expandedFolderIds: string[];
  childrenByParentKey: Record<ParentKey, ChatTreeChildrenSlice>;
  loadingParentKeys: Record<ParentKey, boolean>;
  errorByParentKey: Record<ParentKey, string | undefined>;
  lastPersistedExpandedSignature?: string;
}

interface ChatTreeStoreState {
  workspaces: Record<string, WorkspaceChatTreeState>;
  ensureInitialized: (workspaceId: string) => Promise<void>;
  loadChildren: (workspaceId: string, parentFolderId: string | null) => Promise<void>;
  expandFolder: (workspaceId: string, folderId: string) => Promise<void>;
  collapseFolder: (workspaceId: string, folderId: string) => void;
  toggleFolder: (workspaceId: string, folderId: string) => Promise<void>;
  persistExpandedState: (workspaceId: string) => void;
  flushPersist: (workspaceId: string) => Promise<void>;
}

export const useChatTreeStore = create<ChatTreeStoreState>((set, get) => {
  function updateWorkspaceState(
    workspaceId: string,
    updater: (workspace: WorkspaceChatTreeState) => WorkspaceChatTreeState,
  ): void {
    set((state) => {
      const currentWorkspace = state.workspaces[workspaceId] ?? createEmptyWorkspaceTreeState();
      return {
        workspaces: {
          ...state.workspaces,
          [workspaceId]: updater(currentWorkspace),
        },
      };
    });
  }

  async function hydrateExpandedDescendants(workspaceId: string): Promise<void> {
    const visitedParentKeys = new Set<string>();
    const queue: Array<string | null> = [null];

    while (queue.length > 0) {
      const parentFolderId = queue.shift() ?? null;
      const parentKey = toParentKey(parentFolderId);
      if (visitedParentKeys.has(parentKey)) {
        continue;
      }

      visitedParentKeys.add(parentKey);

      const workspace = get().workspaces[workspaceId];
      if (!workspace) {
        return;
      }

      const childSlice = workspace.childrenByParentKey[parentKey];
      if (!childSlice) {
        continue;
      }

      const expandedFolderIds = new Set(workspace.expandedFolderIds);

      for (const folder of childSlice.folders) {
        if (!expandedFolderIds.has(folder.id)) {
          continue;
        }

        await get().loadChildren(workspaceId, folder.id);
        queue.push(folder.id);
      }
    }
  }

  return {
    workspaces: {},

    ensureInitialized: async (workspaceId: string) => {
      const existingWorkspace = get().workspaces[workspaceId];
      if (existingWorkspace?.initialized || existingWorkspace?.initializing) {
        return;
      }

      updateWorkspaceState(workspaceId, (workspace) => ({
        ...workspace,
        initializing: true,
      }));

      try {
        const [uiState, rootSlice] = await Promise.all([
          window.electronAPI.getChatTreeUiState(workspaceId),
          window.electronAPI.getChatTreeChildren(workspaceId, null),
        ]);

        const normalizedExpandedFolderIds = normalizeExpandedFolderIds(uiState.expandedFolderIds);
        const rootParentKey = toParentKey(null);

        updateWorkspaceState(workspaceId, (workspace) => ({
          ...workspace,
          initialized: true,
          initializing: false,
          expandedFolderIds: normalizedExpandedFolderIds,
          childrenByParentKey: {
            ...workspace.childrenByParentKey,
            [rootParentKey]: rootSlice,
          },
          loadingParentKeys: {
            ...workspace.loadingParentKeys,
            [rootParentKey]: false,
          },
          errorByParentKey: {
            ...workspace.errorByParentKey,
            [rootParentKey]: undefined,
          },
          lastPersistedExpandedSignature: expandedFolderIdsSignature(normalizedExpandedFolderIds),
        }));

        await hydrateExpandedDescendants(workspaceId);
      } catch (error) {
        const rootParentKey = toParentKey(null);
        updateWorkspaceState(workspaceId, (workspace) => ({
          ...workspace,
          initialized: true,
          initializing: false,
          loadingParentKeys: {
            ...workspace.loadingParentKeys,
            [rootParentKey]: false,
          },
          errorByParentKey: {
            ...workspace.errorByParentKey,
            [rootParentKey]: toErrorMessage(error),
          },
        }));
      }
    },

    loadChildren: async (workspaceId: string, parentFolderId: string | null) => {
      const parentKey = toParentKey(parentFolderId);
      const currentWorkspace = get().workspaces[workspaceId] ?? createEmptyWorkspaceTreeState();

      if (currentWorkspace.loadingParentKeys[parentKey]) {
        return;
      }

      if (currentWorkspace.childrenByParentKey[parentKey]) {
        return;
      }

      updateWorkspaceState(workspaceId, (workspace) => ({
        ...workspace,
        loadingParentKeys: {
          ...workspace.loadingParentKeys,
          [parentKey]: true,
        },
        errorByParentKey: {
          ...workspace.errorByParentKey,
          [parentKey]: undefined,
        },
      }));

      try {
        const slice = await window.electronAPI.getChatTreeChildren(workspaceId, parentFolderId);
        updateWorkspaceState(workspaceId, (workspace) => ({
          ...workspace,
          childrenByParentKey: {
            ...workspace.childrenByParentKey,
            [parentKey]: slice,
          },
          loadingParentKeys: {
            ...workspace.loadingParentKeys,
            [parentKey]: false,
          },
          errorByParentKey: {
            ...workspace.errorByParentKey,
            [parentKey]: undefined,
          },
        }));
      } catch (error) {
        updateWorkspaceState(workspaceId, (workspace) => ({
          ...workspace,
          loadingParentKeys: {
            ...workspace.loadingParentKeys,
            [parentKey]: false,
          },
          errorByParentKey: {
            ...workspace.errorByParentKey,
            [parentKey]: toErrorMessage(error),
          },
        }));
      }
    },

    expandFolder: async (workspaceId: string, folderId: string) => {
      updateWorkspaceState(workspaceId, (workspace) => {
        if (workspace.expandedFolderIds.includes(folderId)) {
          return workspace;
        }

        return {
          ...workspace,
          expandedFolderIds: normalizeExpandedFolderIds([...workspace.expandedFolderIds, folderId]),
        };
      });

      get().persistExpandedState(workspaceId);
      await get().loadChildren(workspaceId, folderId);
    },

    collapseFolder: (workspaceId: string, folderId: string) => {
      updateWorkspaceState(workspaceId, (workspace) => ({
        ...workspace,
        expandedFolderIds: workspace.expandedFolderIds.filter((id) => id !== folderId),
      }));

      get().persistExpandedState(workspaceId);
    },

    toggleFolder: async (workspaceId: string, folderId: string) => {
      const workspace = get().workspaces[workspaceId] ?? createEmptyWorkspaceTreeState();
      if (workspace.expandedFolderIds.includes(folderId)) {
        get().collapseFolder(workspaceId, folderId);
        return;
      }

      await get().expandFolder(workspaceId, folderId);
    },

    persistExpandedState: (workspaceId: string) => {
      const existingTimer = persistTimersByWorkspaceId.get(workspaceId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const nextTimer = setTimeout(() => {
        persistTimersByWorkspaceId.delete(workspaceId);
        void get().flushPersist(workspaceId);
      }, TREE_STATE_PERSIST_DEBOUNCE_MS);

      persistTimersByWorkspaceId.set(workspaceId, nextTimer);
    },

    flushPersist: async (workspaceId: string) => {
      const existingTimer = persistTimersByWorkspaceId.get(workspaceId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        persistTimersByWorkspaceId.delete(workspaceId);
      }

      const workspace = get().workspaces[workspaceId];
      if (!workspace) {
        return;
      }

      const normalizedExpandedFolderIds = normalizeExpandedFolderIds(workspace.expandedFolderIds);
      const nextSignature = expandedFolderIdsSignature(normalizedExpandedFolderIds);

      if (workspace.lastPersistedExpandedSignature === nextSignature) {
        if (normalizedExpandedFolderIds !== workspace.expandedFolderIds) {
          updateWorkspaceState(workspaceId, (currentWorkspace) => ({
            ...currentWorkspace,
            expandedFolderIds: normalizedExpandedFolderIds,
          }));
        }
        return;
      }

      try {
        const persistedUiState = await window.electronAPI.setChatTreeUiState(
          workspaceId,
          normalizedExpandedFolderIds,
        );

        const persistedExpandedFolderIds = normalizeExpandedFolderIds(
          persistedUiState.expandedFolderIds,
        );

        updateWorkspaceState(workspaceId, (currentWorkspace) => ({
          ...currentWorkspace,
          expandedFolderIds: persistedExpandedFolderIds,
          lastPersistedExpandedSignature: expandedFolderIdsSignature(persistedExpandedFolderIds),
        }));
      } catch (error) {
        console.error("[chat-tree] Failed to persist expanded folders", error);
      }
    },
  };
});

export function getChatTreeParentKey(parentFolderId: string | null): string {
  return toParentKey(parentFolderId);
}
