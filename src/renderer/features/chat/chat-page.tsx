import { Link } from "@tanstack/react-router";
import { Add01Icon, ArrowDown01Icon, Setting07Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { WindowChrome } from "@/components/app/window-chrome";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ChatPage() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const setActive = useWorkspaceStore((s) => s.setActive);

  return (
    <WindowChrome
      toolbar={
        <div className="flex items-center gap-3 justify-between w-full">
          <Menu>
            <MenuTrigger render={<Button variant="ghost" size="sm" />}>
              {activeWorkspace?.name ?? "…"}
              <HugeiconsIcon icon={ArrowDown01Icon} />
            </MenuTrigger>
            <MenuPopup align="start">
              <Button
                className="w-full justify-start"
                size="xs"
                variant="ghost"
                render={<Link to="/settings/workspaces/new" />}
              >
                <HugeiconsIcon icon={Add01Icon} />
                <span>Create Workspace</span>
              </Button>
              <MenuSeparator />
              <MenuRadioGroup value={activeWorkspace?.id} onValueChange={setActive}>
                {workspaces.map((ws) => (
                  <MenuRadioItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuPopup>
          </Menu>

          <Button
            size="icon-sm"
            variant="ghost"
            render={<Link to="/settings" aria-label="Settings" />}
          >
            <HugeiconsIcon icon={Setting07Icon} />
          </Button>
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
