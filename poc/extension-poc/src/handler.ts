export interface Context {
  rawCode: string;
  messageId: string;
}

export interface SDK {
  openModal: (modalId: string, data: any) => void;
}

export function handleCodeBlockClick(context: Context, sdk: SDK) {
  const { rawCode, messageId } = context;
  sdk.openModal("code_runner_modal", { rawCode, messageId });
}

// Ensure this module is not tree-shaken away by adding a side effect
console.log("Extension handlers loaded 🚀");
