import { ContextMenuPayload } from "..";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../../ui/dropdown-menu";
import { openActionDialog } from "../../actions";

interface ChatFolderContextMenuProps {
  payload: ContextMenuPayload;
}

/**
 * Context menu for chat folders
 * Provides actions like rename, create new chat, create subfolder, and delete
 */
export function ChatFolderContextMenu(props: ChatFolderContextMenuProps) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log("Rename folder", props.payload.id)}
      >
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          console.log("Create new chat in folder", props.payload.id)
        }
      >
        New Chat
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log("Create subfolder", props.payload.id)}
      >
        New Folder
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          openActionDialog("delete-chat-folder", {
            folderId: props.payload.id,
          });
        }}
        class="text-red-500"
      >
        Delete
      </DropdownMenuItem>
    </>
  );
}
