import { createSignal } from 'solid-js'

// Define the types of context menus we can have
type CONTEXT_MENU_TYPE =
  | 'item'
  | 'workspace'
  | 'chat'
  | 'chat-ai-model-button'
  | 'chat-node'
  | 'chat-folder'

// Generic type for context menu payloads
export type ContextMenuPayload = {
  id: string
  [key: string]: any
}

// Context menu state type
type ContextMenuState = {
  type: CONTEXT_MENU_TYPE
  payload: ContextMenuPayload
  position: { x: number; y: number }
}

// Create a signal to store the context menu state
const [contextMenuState, setContextMenuState] =
  createSignal<ContextMenuState | null>(null)

/**
 * Opens a context menu at the position of the event
 * @param type The type of context menu to open
 * @param payload The data to pass to the context menu
 * @returns A function that handles the context menu event
 */
export const openContextMenu =
  (type: CONTEXT_MENU_TYPE, payload: ContextMenuPayload) =>
  (event: MouseEvent) => {
    // Prevent the default context menu
    event.preventDefault()
    event.stopPropagation()

    // Set the context menu state with the type, payload, and position
    setContextMenuState({
      type,
      payload,
      position: { x: event.clientX, y: event.clientY },
    })
  }

/**
 * Closes the context menu
 */
export const closeContextMenu = () => {
  setContextMenuState(null)
}

// Export the state for use in components
export { contextMenuState }
