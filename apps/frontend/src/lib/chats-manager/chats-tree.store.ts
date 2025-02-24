import { createStoreWithProducer } from "@xstate/store";
import { produce } from "immer";
import { TauriFlatItem } from "../../interfaces/tauri/chat";

export const chatsTreeStore = createStoreWithProducer(produce, {
  context: {
    tree: [] as (TauriFlatItem & { isOpen: boolean })[],
    openFolders: new Set<string>(),

    state: "loading" as "loading" | "done" | "error",
  },
  on: {
    setup: (
      context,
      event: { tree: TauriFlatItem[]; openFolders: Set<string> | null }
    ) => {
      context.tree = event.tree.map((x) => ({ ...x, isOpen: false }));
      context.state = "done" as const;
      context.openFolders = event.openFolders ?? new Set<string>();
    },

    toggleFolder: (context, event: { id: string }, { emit }) => {
      context.openFolders.has(event.id)
        ? context.openFolders.delete(event.id)
        : context.openFolders.add(event.id);

      const nodeIdx = context.tree.findIndex(
        (node) => node.type === "folder" && node.id === event.id
      );
      if (nodeIdx !== -1) {
        context.tree[nodeIdx].isOpen = !context.tree[nodeIdx].isOpen;
      }

      emit({
        type: "open-folders",
        ids: Array.from(context.openFolders),
      } as any);
    },

    openFolder: (context, event: { id: string }, { emit }) => {
      console.log("openFolder", event.id);
      context.openFolders.add(event.id);
      emit({
        type: "open-folders",
        ids: Array.from(context.openFolders),
      } as any);
    },
  },
});
