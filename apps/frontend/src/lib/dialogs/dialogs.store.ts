import { createStoreWithProducer } from "@xstate/store";
import { produce } from "immer";

type Dialog = "delete-chat";

export const dialogStore = createStoreWithProducer(
  produce,
  {
    dialog: null as Dialog | null,
    props: {} as Record<string, any>, // TODO: type this
  },
  {
    open: (context, event: { dialog: Dialog; props: Record<string, any> }) => {
      context.dialog = event.dialog;
      context.props = event.props;
    },
    close: (context) => {
      context.dialog = null;
      context.props = {};
    },
  }
);
