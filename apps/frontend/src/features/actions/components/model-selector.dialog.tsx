import {
  DialogActions,
  DialogCloseButton,
  DialogDescription,
  DialogLabel,
} from "../../../ui/dialog";

export type MODEL_SELECTOR_EVENT_ID = "model-selector";

export interface ModelSelectorDialogProps {
  chatId: string;
}

export function ModelSelectorDialog(props: ModelSelectorDialogProps) {
  return (
    <>
      <DialogLabel>Select a model</DialogLabel>

      <DialogDescription>{JSON.stringify(props)}</DialogDescription>

      <DialogActions>
        <DialogCloseButton>Cancel</DialogCloseButton>
      </DialogActions>
    </>
  );
}
