import { Component, lazy, Suspense } from "solid-js";

const SystemPrompt = lazy(() => import("../../chat-context/system-prompt"));

export const CHAT_SYSTEM_PROMPT_DIALOG_EVENT_ID = "chat-system-prompt-dialog";

/**
 * Props for the ChatSystemPromptDialog component.
 * Add any necessary props here.
 */
export interface ChatSystemPromptDialogProps {
  branchId: string;
}

/**
 * ChatSystemPromptDialog Component
 *
 * This dialog allows users to view or edit the system prompt for the chat.
 */
export const ChatSystemPromptDialog: Component<ChatSystemPromptDialogProps> = (
  props
) => {
  // TODO: Implement the actual dialog content here.
  // This might involve using UI components like Input, Textarea, Button, etc.
  // from the project's UI library (e.g., ../../ui/...)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SystemPrompt branchId={props.branchId} />
    </Suspense>
  );
};
