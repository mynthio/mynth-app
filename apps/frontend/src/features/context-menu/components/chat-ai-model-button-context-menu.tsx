import { ContextMenuPayload } from '..'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../ui/dropdown-menu'

interface ChatAiModelButtonContextMenuProps {
  payload: ContextMenuPayload
}

/**
 * Context menu for the chat AI model button
 * Provides options to select, configure or get info about AI models
 */
export function ChatAiModelButtonContextMenu(
  props: ChatAiModelButtonContextMenuProps
) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => console.log('Select model', props.payload.id)}
      >
        Select Model
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Configure model', props.payload.id)}
      >
        Configure Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => console.log('View model info', props.payload.id)}
      >
        Hyperbolic / Llama 3.3. 70B
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Set as default', props.payload.id)}
      >
        Groq / DeepSeek Coder 32B
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => console.log('Set as default', props.payload.id)}
      >
        Groq / Claude 3.5 Sonnet
      </DropdownMenuItem>
    </>
  )
}
