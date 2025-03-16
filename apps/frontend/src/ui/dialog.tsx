import CorvuDialog from "@corvu/dialog";
import { ComponentProps, JSX } from "solid-js";
import { Button, ButtonProps } from "./button";

export const useDialog = CorvuDialog.useContext;

interface DialogProps extends ComponentProps<typeof CorvuDialog> {}

export function Dialog(props: DialogProps) {
  return <CorvuDialog {...props} />;
}

interface DialogTriggerProps
  extends ComponentProps<typeof CorvuDialog.Trigger> {}

export function DialogTrigger(props: DialogTriggerProps) {
  return <CorvuDialog.Trigger {...props} />;
}

interface DialogContentProps
  extends ComponentProps<typeof CorvuDialog.Content> {}

export function DialogContent(props: DialogContentProps) {
  return (
    <CorvuDialog.Portal>
      <CorvuDialog.Overlay class="fixed inset-0 z-50 bg-background/70 backdrop-blur-2px data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:animate-duration-[300ms] data-[open]:animate-duration-[300ms]" />
      <div class="fixed z-50 pointer-events-none top-0 left-0 right-0 bottom-0 flex items-center justify-center">
        <CorvuDialog.Content
          {...props}
          class="max-w-560px rounded-lg border-2 border-accent/10 bg-[#000408] px-6 py-5 data-[open]:animate-in data-[open]:zoom-in-90 data-[open]:slide-in-b-10 data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:slide-out-b-10 data-[closed]:zoom-out-90 data-[closed]:fade-out-0 data-[closed]:animate-duration-[300ms] data-[open]:animate-duration-[300ms]"
        />
      </div>
    </CorvuDialog.Portal>
  );
}

interface DialogLabelProps extends ComponentProps<typeof CorvuDialog.Label> {}

export function DialogLabel(props: DialogLabelProps) {
  return <CorvuDialog.Label {...props} class="text-16px font-500" />;
}

interface DialogDescriptionProps
  extends ComponentProps<typeof CorvuDialog.Description> {}

export function DialogDescription(props: DialogDescriptionProps) {
  return (
    <CorvuDialog.Description {...props} class="text-16px font-300 mt-12px" />
  );
}

interface DialogCloseButtonProps
  extends ComponentProps<typeof CorvuDialog.Close> {}

export function DialogCloseButton(props: DialogCloseButtonProps) {
  return <CorvuDialog.Close {...props} />;
}

interface DialogActionsProps {
  children: JSX.Element;
}

export function DialogActions(props: DialogActionsProps) {
  return (
    <div class="flex items-center justify-end gap-6px mt-24px">
      {props.children}
    </div>
  );
}

interface DialogActionButtonProps extends ButtonProps {}

export function DialogActionButton(props: DialogActionButtonProps) {
  return <Button {...props} />;
}
