import { Match, Switch } from "solid-js";

import { closeContextMenu, contextMenuState } from ".";
import { WorkspaceContextMenu } from "./components/workspace-context-menu";
import { ItemContextMenu } from "./components/item-context-menu";
import { ChatContextMenu } from "./components/chat-context-menu";
import { DropdownMenu, DropdownMenuContent } from "../../ui/dropdown-menu";

/**
 * Container component that renders the appropriate context menu based on the type
 */
export function ContextMenuContainer() {
  return (
    <DropdownMenu
      open={!!contextMenuState()?.type}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          closeContextMenu();
        }
      }}
      gutter={5}
      getAnchorRect={() => {
        return {
          x: contextMenuState()?.position.x,
          y: contextMenuState()?.position.y,
        };
      }}
    >
      <DropdownMenuContent>
        <Switch>
          <Match when={contextMenuState()?.type === "item"}>
            <ItemContextMenu payload={contextMenuState()?.payload!} />
          </Match>
          <Match when={contextMenuState()?.type === "workspace"}>
            <WorkspaceContextMenu payload={contextMenuState()?.payload!} />
          </Match>
          <Match when={contextMenuState()?.type === "chat"}>
            <ChatContextMenu payload={contextMenuState()?.payload!} />
          </Match>
        </Switch>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
