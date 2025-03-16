import { ContextMenuPayload } from "..";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../../ui/dropdown-menu";
import { openActionDialog } from "../../actions";

interface WorkspaceContextMenuProps {
  payload: ContextMenuPayload;
}

/**
 * Context menu for workspaces
 */
export function WorkspaceContextMenu(props: WorkspaceContextMenuProps) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log("Rename workspace", props.payload.id)}
      >
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log("Share workspace", props.payload.id)}
      >
        Share
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          openActionDialog("delete-workspace", {
            workspaceId: props.payload.id,
          });
        }}
        class="text-red-500"
      >
        Delete
      </DropdownMenuItem>
    </>
  );
}
