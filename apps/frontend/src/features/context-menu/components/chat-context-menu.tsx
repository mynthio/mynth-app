import { ContextMenuPayload } from "..";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../../ui/dropdown-menu";

interface ChatContextMenuProps {
  payload: ContextMenuPayload;
}

/**
 * Context menu for chats
 */
export function ChatContextMenu(props: ChatContextMenuProps) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log("Rename chat", props.payload.id)}
      >
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log("Export chat", props.payload.id)}
      >
        Export
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => console.log("Delete chat", props.payload.id)}
        class="text-red-500"
      >
        Delete
      </DropdownMenuItem>
    </>
  );
}
