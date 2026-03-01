import { WorkspaceInfo } from "src/shared/ipc";
import type { StateCreator } from "zustand";
import "zustand/middleware/immer";

export type TabType = "chat";

export interface Tab {
  id: string;

  type: TabType;
  chatId: string;

  isDirty?: boolean;
}

export type WorkspaceState = "idle" | "loading";

export interface WorkspaceSliceValue {
  state: WorkspaceState;
  workspace: WorkspaceInfo | null;
}

export interface WorkspaceSlice extends WorkspaceSliceValue {
  switchWorkspace: (id: string) => Promise<void>;
}

export interface TabsSliceValue {
  tabs: Tab[];
  activeTabId: string | null;
}

export interface TabsSlice extends TabsSliceValue {
  openTab: (chatId: string, opts?: { mode: "auto" | "new-tab" }) => void;
  closeTab: (tabId: string) => void;

  setActiveTab: (tabId: string) => void;

  activeTab: () => Tab | null;
}

export interface TreeSliceValue {
  expandedTreeNodes: string[];
}

export interface TreeSlice extends TreeSliceValue {
  toggleNode: (nodeId: string) => void;
  setExpandedNodes: (nodes: string[]) => void;

  collapseAll: () => void;
}

export type WorkspaceStoreValues = WorkspaceSliceValue & TabsSliceValue & TreeSliceValue;

export type WorkspaceStoreState = WorkspaceSlice & TabsSlice & TreeSlice;

export type WorkspaceStoreMutators = [["zustand/immer", never]];

export type WorkspaceSliceCreator<T> = StateCreator<
  WorkspaceStoreState,
  WorkspaceStoreMutators,
  [],
  T
>;
