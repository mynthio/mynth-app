import CorvuDialog from '@corvu/dialog'

import { ComponentProps, JSX } from 'solid-js'

import { Button, ButtonProps } from './button'

export const useDialog = CorvuDialog.useContext

interface DialogProps extends ComponentProps<typeof CorvuDialog> {}

export function Dialog(props: DialogProps) {
  return <CorvuDialog hideScrollbar={false} {...props} />
}

interface DialogTriggerProps
  extends ComponentProps<typeof CorvuDialog.Trigger> {}

export function DialogTrigger(props: DialogTriggerProps) {
  return <CorvuDialog.Trigger {...props} />
}

interface DialogContentProps
  extends ComponentProps<typeof CorvuDialog.Content> {}

export function DialogContent(props: DialogContentProps) {
  return (
    <CorvuDialog.Portal>
      <CorvuDialog.Overlay
        class="
        fixed inset-0 z-50 bg-background/65 backdrop-blur-0px

        data-[open]:animate-in data-[open]:fade-in-0 data-[open]:animate-duration-[200ms]
        data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:animate-duration-[200ms]"
      />

      <div class="fixed z-50 pointer-events-none top-0 left-0 right-0 bottom-0 flex items-center justify-center">
        <CorvuDialog.Content
          {...props}
          class={`
            min-w-400px min-h-200px rounded-14px border-2 border-elements-background-soft
            bg-elements-background
            p-24px
            data-[open]:animate-in data-[open]:zoom-in-95 data-[open]:fade-in-0 data-[open]:animate-duration-[300ms]
            data-[closed]:animate-out data-[closed]:zoom-out-95 data-[closed]:fade-out-0 data-[closed]:animate-duration-[200ms] ${props.class}`}
        />
      </div>
    </CorvuDialog.Portal>
  )
}

interface DialogLabelProps extends ComponentProps<typeof CorvuDialog.Label> {}

export function DialogLabel(props: DialogLabelProps) {
  return <CorvuDialog.Label {...props} class="text-16px font-500" />
}

interface DialogDescriptionProps
  extends ComponentProps<typeof CorvuDialog.Description> {}

export function DialogDescription(props: DialogDescriptionProps) {
  return (
    <CorvuDialog.Description {...props} class="text-16px font-300 mt-12px" />
  )
}

interface DialogCloseButtonProps
  extends ComponentProps<typeof CorvuDialog.Close> {}

export function DialogCloseButton(props: DialogCloseButtonProps) {
  return <CorvuDialog.Close {...props} />
}

interface DialogActionsProps {
  children: JSX.Element
}

export function DialogActions(props: DialogActionsProps) {
  return (
    <div class="flex items-center justify-end gap-6px mt-24px">
      {props.children}
    </div>
  )
}

interface DialogActionButtonProps extends ButtonProps {}

export function DialogActionButton(props: DialogActionButtonProps) {
  return <Button {...props} />
}
