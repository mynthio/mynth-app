import { Link } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "@/components/ui/menu";
import { WindowChrome } from "@/components/app/window-chrome";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ChatPage() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const setActive = useWorkspaceStore((s) => s.setActive);

  return (
    <WindowChrome
      toolbar={
        <div className="flex items-center gap-3">
          <Menu>
            <MenuTrigger render={<Button variant="ghost" size="sm" />}>
              {activeWorkspace?.name ?? "…"}
              <ChevronDownIcon />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuRadioGroup value={activeWorkspace?.id} onValueChange={setActive}>
                {workspaces.map((ws) => (
                  <MenuRadioItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuPopup>
          </Menu>
          <Link
            to="/settings"
            className="inline-flex h-7 items-center rounded-md border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Settings
          </Link>
        </div>
      }
      contentClassName="overflow-auto"
    >
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
        <p className="text-muted-foreground">Chat interface coming soon.</p>
        <Link
          to="/settings"
          className="inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Settings
        </Link>
      </main>
    </WindowChrome>
  );
}
