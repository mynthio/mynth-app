import { createShortcut } from "@solid-primitives/keyboard";
import { useTabsManager } from "../hooks/use-tabs-manager";
import { useLocation } from "@solidjs/router";

export default function TabsManagerKeyboardShortcuts() {
  const location = useLocation();

  const { closeTab, openEmptyTab } = useTabsManager();

  createShortcut(
    ["Meta", "T"],
    () => {
      openEmptyTab();
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "W"],
    () => {
      closeTab(location.pathname);
    },
    { preventDefault: true, requireReset: false }
  );

  createShortcut(
    ["Meta", "ArrowLeft"],
    () => {
      closeTab(location.pathname);
    },
    { preventDefault: true, requireReset: false }
  );

  return null;
}
