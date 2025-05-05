import { ContextMenuPayload } from '..'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../ui/dropdown-menu'

interface ChatNodeContextMenuProps {
  payload: ContextMenuPayload
}

/**
 * Context menu for chat nodes
 * Provides options for managing and interacting with chat nodes
 */
export function ChatNodeContextMenu(props: ChatNodeContextMenuProps) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log('Edit node', props.payload.id)}
      >
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Duplicate node', props.payload.id)}
      >
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => console.log('Copy node content', props.payload.id)}
      >
        Copy Content
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Regenerate node', props.payload.id)}
      >
        Regenerate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => console.log('Delete node', props.payload.id)}
        class="text-red-500"
      >
        Delete
      </DropdownMenuItem>
    </>
  )
}
