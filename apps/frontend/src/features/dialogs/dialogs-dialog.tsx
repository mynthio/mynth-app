import { Match, Switch } from 'solid-js'

import {
  ChatModelSelectionDialog,
  ChatModelSelectionDialogProps,
  ChatSystemPromptDialog,
  ChatSystemPromptDialogProps,
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
      <DialogContent class="w-full max-w-90% h-full max-h-90% py-32px px-24px relative">
        {/* <button
          class="absolute top-24px left-24px text-muted flex items-center gap-8px"
          onClick={() => {
            closeDialog();
          }}
        >
          <div class="i-lucide:arrow-left text-14px" />
          <span class="text-ui">Back to app</span>
        </button> */}

        {/* <button
          class="absolute top-24px right-24px text-muted flex items-center"
          onClick={() => {
            closeDialog();
          }}
        >
          <div class="i-lucide:x text-14px" />
        </button> */}

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
          {/* Add Match cases for other dialog types here */}
          {/* <Match when={dialogsState()?.type === "other-dialog"}>
            <OtherDialog
              {...(dialogsState()?.payload as OtherDialogProps)}
            />
          </Match> */}
        </Switch>
        {/* <div class="flex items-center justify-center gap-12px absolute bottom-8px w-full">
          <span class="text-ui-small text-muted">
            MYNTH APP ALPHA 0.0.243 (17 APR. 2025) - Rhino
          </span>
        </div> */}
      </DialogContent>
    </Dialog>
  )
}
