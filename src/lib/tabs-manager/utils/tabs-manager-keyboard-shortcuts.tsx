import { createShortcut } from "@solid-primitives/keyboard";

import { tabsManager } from "../tabs-manager.store";

export default function TabsManagerKeyboardShortcuts() {
  createShortcut(
    ["Meta", "T"],
    () => {
      tabsManager.send({
        type: "addTab",
        id: "1",
        title: "New Chat",
        chatId: "1",
      });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "W"],
    () => {
      tabsManager.send({ type: "closeActiveTab" });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "ArrowLeft"],
    () => {
      tabsManager.send({ type: "previousTab" });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "ArrowRight"],
    () => {
      tabsManager.send({ type: "nextTab" });
    },
    { preventDefault: true, requireReset: false }
  );

  return null;
}
