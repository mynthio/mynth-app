import { createShortcut } from "@solid-primitives/keyboard";

import {
  toggleSidebar,
  toggleSidebarComponent,
} from "../../stores/sidebar/sidebar-store";

export default function SidebarManagerKeyboardShortcuts() {
  createShortcut(
    ["Meta", "B"],
    () => {
      toggleSidebar();
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "E"],
    () => {
      toggleSidebarComponent("chats");
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "I"],
    () => {
      toggleSidebarComponent("ai_integrations");
    },
    { preventDefault: true, requireReset: false }
  );

  return null;
}
