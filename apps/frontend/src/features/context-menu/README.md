# Context Menu Feature

This feature provides a reusable context menu system for the Mynth App. It allows you to easily add context menus to any element in your application.

## Usage

### Basic Usage

```tsx
import { openContextMenu } from "@features/context-menu";

function MyComponent() {
  return (
    <button onContextMenu={openContextMenu("item", { id: "item_123" })}>
      Right-click me
    </button>
  );
}
```

### Available Context Menu Types

The context menu system supports the following types:

- `item`: For general items
- `workspace`: For workspace-related actions
- `chat`: For chat-related actions

You can add more types by:

1. Adding the type to the `CONTEXT_MENU_TYPE` in `index.ts`
2. Creating a component for the new type in the `components` directory
3. Adding a case for the new type in the `Switch` statement in `context-menu-container.tsx`

### Integration

To integrate the context menu system into your application, add the `ContextMenuContainer` component to your app's root component:

```tsx
import { ContextMenuContainer } from "@features/context-menu/context-menu-container";

function App() {
  return (
    <>
      {/* Your app content */}
      <ContextMenuContainer />
    </>
  );
}
```

## Architecture

The context menu feature consists of:

- `index.ts`: Contains the state management and the `openContextMenu` function
- `context-menu-container.tsx`: The container component that renders the appropriate context menu based on the type
- `components/`: Directory containing the different context menu components

## Extending

To add a new action to an existing context menu, simply modify the corresponding component in the `components` directory.

## Example

See `example.tsx` for a complete example of how to use the context menu feature.
