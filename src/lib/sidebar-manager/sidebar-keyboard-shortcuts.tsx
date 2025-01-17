import { createShortcut } from "@solid-primitives/keyboard";

import { sidebarManager } from "./sidebar-manager.store";

export default function SidebarManagerKeyboardShortcuts() {
  createShortcut(
    ["Meta", "B"],
    () => {
      sidebarManager.send({
        type: "toggle",
      });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "E"],
    () => {
      sidebarManager.send({
        type: "toggle",
        content: "chats",
      });
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "I"],
    () => {
      sidebarManager.send({
        type: "toggle",
        content: "ai_integrations",
      });
    },
    { preventDefault: true, requireReset: false }
  );

  return null;
}
