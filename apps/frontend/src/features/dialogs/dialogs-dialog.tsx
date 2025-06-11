import { Match, Switch } from 'solid-js'

import {
  ChatModelSelectionDialog,
  ChatModelSelectionDialogProps,
  ChatSystemPromptDialog,
  ChatSystemPromptDialogProps,
  ExtensionDialog,
  ExtensionDialogProps,
  closeDialog,
  dialogsState,
} from '.'
import { Dialog, DialogContent } from '../../ui/dialog'
import {
  AppSettingsDialog,
  AppSettingsDialogProps,
} from './components/app-settings.dialog'

export function DialogsDialog() {
  return (
    <Dialog
      open={dialogsState()?.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
      noOutsidePointerEvents={false} // Adjust as needed for larger dialogs
    >
      <DialogContent
        class={`w-[90%] h-[90%] py-32px px-24px relative ${
          dialogsState()?.size === 'medium'
            ? 'max-w-[1100px] max-h-[600px]'
            : 'max-w-90% max-h-90%'
        }`}
      >
        <Switch>
          <Match when={dialogsState()?.type === 'app-settings'}>
            <AppSettingsDialog
              {...(dialogsState()?.payload as AppSettingsDialogProps)}
            />
          </Match>
          <Match when={dialogsState()?.type === 'chat-system-prompt-dialog'}>
            <ChatSystemPromptDialog
              {...(dialogsState()?.payload as ChatSystemPromptDialogProps)}
            />
          </Match>
          <Match when={dialogsState()?.type === 'chat-model-selection'}>
            <ChatModelSelectionDialog
              {...(dialogsState()?.payload as ChatModelSelectionDialogProps)}
            />
          </Match>
          <Match when={dialogsState()?.type === 'extension'}>
            <ExtensionDialog
              {...(dialogsState()?.payload as ExtensionDialogProps)}
            />
          </Match>
          {/* Add Match cases for other dialog types here */}
          {/* <Match when={dialogsState()?.type === "other-dialog"}>
            <OtherDialog
              {...(dialogsState()?.payload as OtherDialogProps)}
            />
          </Match> */}
        </Switch>
      </DialogContent>
    </Dialog>
  )
}
