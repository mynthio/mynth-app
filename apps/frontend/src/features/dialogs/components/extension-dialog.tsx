import { Component, Suspense, lazy } from 'solid-js'

export const EXTENSION_DIALOG_EVENT_ID = 'extension'

/**
 * Props for the ExtensionDialog component.
 * Contains the payload passed by extensions with extensionId and modal handler name.
 */
export interface ExtensionDialogProps {
  payload: any // The payload passed by extensions (type any as requested)
  extensionId: string // ID of the extension that opened this dialog
  modalHandlerName: string // Name of the modal handler
}

/**
 * ExtensionDialog Component
 *
 * This dialog handles extension-specific modals. Extensions can pass custom payloads
 * and specify their own modal handler logic. Currently just a placeholder until
 * extension logic is implemented.
 *
 * 🚀 Pro tip: This is where extension magic happens!
 */
export const ExtensionDialog: Component<ExtensionDialogProps> = (props) => {
  // TODO: Implement the actual extension dialog logic here
  // This will need to:
  // - Load the appropriate extension component based on extensionId
  // - Pass the payload to the extension's modal handler
  // - Handle extension-specific interactions and state management
  const ContentComponent = lazy(
    () =>
      import(
        // @ts-ignore
        `/Users/tom/Library/Application Support/com.mynth.macos/extensions/poc/ui.jsx`
      )
  )

  return (
    <div class="p-24px">
      <div class="text-lg font-semibold mb-16px">Extension Dialog</div>

      <div class="space-y-12px text-sm text-muted">
        <div>
          <span class="font-medium">Extension ID:</span> {props.extensionId}
        </div>
        <hr />
        <div>
          <Suspense fallback={<div>Loading...</div>}>
            <ContentComponent data={props.payload} />
          </Suspense>
        </div>
        <hr />
        <div>
          <span class="font-medium">Modal Handler:</span>{' '}
          {props.modalHandlerName}
        </div>
        <div>
          <span class="font-medium">Payload:</span>
          <pre class="mt-4px p-8px bg-muted/10 rounded text-xs overflow-auto">
            {JSON.stringify(props, null, 2)}
          </pre>
        </div>
      </div>

      <div class="mt-24px text-center text-muted text-sm">
        🔧 Extension dialog content will be loaded here once extension logic is
        implemented
      </div>
    </div>
  )
}
