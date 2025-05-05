import { ContextMenuPayload } from '..'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../ui/dropdown-menu'

interface ItemContextMenuProps {
  payload: ContextMenuPayload
}

/**
 * Context menu for items
 */
export function ItemContextMenu(props: ItemContextMenuProps) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log('Edit item', props.payload.id)}
      >
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Duplicate item', props.payload.id)}
      >
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => console.log('Delete item', props.payload.id)}
        class="text-red-500"
      >
        Delete
      </DropdownMenuItem>
    </>
  )
}
