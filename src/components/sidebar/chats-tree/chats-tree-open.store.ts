import { createStore, produce } from "solid-js/store";
import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

const [chatsTreeOpen, setChatsTreeOpen] = makePersisted(
  createSignal<Record<string, true>>({}),
  {
    name: "mynth:tree:open:state",
    // Local storage is default
  }
);

function toggleFolder(id: string) {
  setChatsTreeOpen((state) => ({
    ...state,
    [id]: !state[id],
  }));
}

export { chatsTreeOpen, toggleFolder };
