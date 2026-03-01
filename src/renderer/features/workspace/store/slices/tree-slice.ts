import type { TreeSlice, WorkspaceSliceCreator } from "../types";

export const createTreeSlice: WorkspaceSliceCreator<TreeSlice> = (set) => ({
  expandedTreeNodes: [],

  collapseAll: () => {
    set((state) => {
      state.expandedTreeNodes = [];
    });
  },
  setExpandedNodes: (newExpandedTreeNodes: string[]) => {
    set((state) => {
      state.expandedTreeNodes = newExpandedTreeNodes;
    });
  },
  toggleNode: (nodeId: string) => {
    set((state) => {
      const nodeIndex = state.expandedTreeNodes.indexOf(nodeId);

      void (nodeIndex === -1
        ? state.expandedTreeNodes.push(nodeId)
        : state.expandedTreeNodes.splice(nodeIndex, 1));
    });
  },
});
