import * as React from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

import type { MynthUiMessage } from "@shared/chat/message-metadata";
import type { EditMessageBehavior } from "@shared/ipc";
import {
  useChatContinueMessage,
  useChatRegenerateMessage,
  useChatStartEditingMessage,
  useChatStopEditingMessage,
  useChatSubmitEditedMessage,
  useChatSwitchBranch,
} from "@/features/chat/chat-context";
import { useChatScrollToBottom } from "@/features/chat/chat-scroll-context";
import { useMessageContextMenu } from "@/hooks/use-message-context-menu";

import "streamdown/styles.css";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Edit01Icon,
  Refresh04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Group } from "@/components/ui/group";
import { Textarea } from "@/components/ui/textarea";

const STREAMDOWN_PLUGINS = { code };
const STREAMDOWN_ANIMATION = {
  animation: "blurIn",
  duration: 50,
  easing: "ease-out",
} as const;

// --- Text parts ---

interface UserMessageTextPartProps {
  text: string;
}

const UserMessageTextPart = React.memo(function UserMessageTextPart({
  text,
}: UserMessageTextPartProps) {
  return (
    <Streamdown
      mode="static"
      plugins={STREAMDOWN_PLUGINS}
      className="text-[0.9375rem] leading-[1.6]"
    >
      {text}
    </Streamdown>
  );
});

interface AssistantMessageTextPartProps {
  text: string;
  isAnimating: boolean;
}

const AssistantMessageTextPart = React.memo(function AssistantMessageTextPart({
  text,
  isAnimating,
}: AssistantMessageTextPartProps) {
  return (
    <Streamdown
      mode={isAnimating ? "streaming" : "static"}
      plugins={STREAMDOWN_PLUGINS}
      animated={STREAMDOWN_ANIMATION}
      isAnimating={isAnimating}
      className="text-[1.0625rem] text-foreground/85 leading-[1.75]"
    >
      {text}
    </Streamdown>
  );
});

// --- Role-specific tools components ---
interface MessageToolsProps extends React.ComponentProps<"div"> {
  forceVisible?: boolean;
}

const MessageTools = React.memo(function MessageTools({
  className,
  forceVisible = false,
  ...props
}: MessageToolsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 transition-opacity duration-150",
        forceVisible ? "opacity-100" : "opacity-0 group-hover/message:opacity-100",
        className,
      )}
      {...props}
    />
  );
});

interface AssistantMessageToolsProps {
  draft: string;
  isEditing: boolean;
  isInteractionLocked: boolean;
  message: MynthUiMessage;
  messageText: string;
  onDraftChange: (value: string) => void;
  startEditingMessage: (messageId: string) => void;
  stopEditingMessage: () => void;
  submitEditedMessage: (
    messageId: string,
    text: string,
    behavior: EditMessageBehavior,
  ) => Promise<void>;
}

const AssistantMessageTools = React.memo(function AssistantMessageTools({
  draft,
  isEditing,
  isInteractionLocked,
  message,
  messageText,
  onDraftChange,
  startEditingMessage,
  stopEditingMessage,
  submitEditedMessage,
}: AssistantMessageToolsProps) {
  const continueMessage = useChatContinueMessage();
  const regenerate = useChatRegenerateMessage();
  const scrollToBottom = useChatScrollToBottom();
  const switchBranch = useChatSwitchBranch();

  const siblings = message.metadata?.siblings ?? [];
  const siblingIndex = message.metadata?.siblingIndex ?? 0;
  const prevSiblingId = siblings[siblingIndex - 1];
  const nextSiblingId = siblings[siblingIndex + 1];
  const hasSiblings = siblings.length > 1;

  if (isEditing) {
    return (
      <EditableMessageTools
        canSave={draft.trim().length > 0}
        draft={draft}
        messageId={message.id}
        messageText={messageText}
        onDraftChange={onDraftChange}
        stopEditingMessage={stopEditingMessage}
        submitEditedMessage={submitEditedMessage}
      />
    );
  }

  return (
    <MessageTools>
      <Button
        size="xs"
        variant="ghost"
        disabled={isInteractionLocked}
        onClick={() => {
          scrollToBottom();
          void continueMessage(message.id);
        }}
      >
        Continue
      </Button>

      <Button
        size="icon-sm"
        variant="ghost"
        disabled={isInteractionLocked}
        onClick={() => {
          scrollToBottom();
          regenerate({ messageId: message.id });
        }}
      >
        <HugeiconsIcon icon={Refresh04Icon} />
      </Button>

      <Button
        size="icon-sm"
        variant="secondary"
        disabled={isInteractionLocked}
        onClick={() => startEditingMessage(message.id)}
      >
        <HugeiconsIcon icon={Edit01Icon} />
      </Button>

      {hasSiblings && (
        <>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isInteractionLocked || !prevSiblingId}
            onClick={() => prevSiblingId && void switchBranch(prevSiblingId)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Button>
          <Button
            disabled={isInteractionLocked}
            variant="ghost"
            size="sm"
            className="text-primary-foreground font-light sm:text-xs"
          >
            {siblingIndex + 1}/{siblings.length}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isInteractionLocked || !nextSiblingId}
            onClick={() => nextSiblingId && void switchBranch(nextSiblingId)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        </>
      )}
    </MessageTools>
  );
});

interface EditableMessageToolsProps {
  canSave: boolean;
  draft: string;
  messageId: string;
  messageText: string;
  onDraftChange: (value: string) => void;
  stopEditingMessage: () => void;
  submitEditedMessage: (
    messageId: string,
    text: string,
    behavior: EditMessageBehavior,
  ) => Promise<void>;
}

const EditableMessageTools = React.memo(function EditableMessageTools({
  canSave,
  draft,
  messageId,
  messageText,
  onDraftChange,
  stopEditingMessage,
  submitEditedMessage,
}: EditableMessageToolsProps) {
  return (
    <MessageTools forceVisible>
      <Group>
        <Button
          size="xs"
          disabled={!canSave}
          onClick={() => {
            void submitEditedMessage(messageId, draft, "overwrite");
          }}
        >
          Save
        </Button>
        <Button
          size="xs"
          variant="secondary"
          disabled={!canSave}
          onClick={() => {
            void submitEditedMessage(messageId, draft, "branch");
          }}
        >
          Save as new branch
        </Button>
        <Button
          size="xs"
          variant="secondary"
          onClick={() => {
            onDraftChange(messageText);
            stopEditingMessage();
          }}
        >
          Cancel
        </Button>
      </Group>
    </MessageTools>
  );
});

interface UserMessageToolsProps {
  draft: string;
  isEditing: boolean;
  isInteractionLocked: boolean;
  messageId: string;
  messageText: string;
  modelId: string | null;
  onDraftChange: (value: string) => void;
  startEditingMessage: (messageId: string) => void;
  stopEditingMessage: () => void;
  submitEditedMessage: (
    messageId: string,
    text: string,
    behavior: EditMessageBehavior,
  ) => Promise<void>;
}

const UserMessageTools = React.memo(function UserMessageTools({
  draft,
  isEditing,
  isInteractionLocked,
  messageId,
  messageText,
  modelId,
  onDraftChange,
  startEditingMessage,
  stopEditingMessage,
  submitEditedMessage,
}: UserMessageToolsProps) {
  if (isEditing) {
    return (
      <EditableMessageTools
        canSave={Boolean(modelId) && draft.trim().length > 0}
        draft={draft}
        messageId={messageId}
        messageText={messageText}
        onDraftChange={onDraftChange}
        stopEditingMessage={stopEditingMessage}
        submitEditedMessage={submitEditedMessage}
      />
    );
  }

  return (
    <MessageTools>
      <Button
        size="icon-sm"
        variant="secondary"
        disabled={isInteractionLocked}
        onClick={() => startEditingMessage(messageId)}
      >
        <HugeiconsIcon icon={Edit01Icon} />
      </Button>
    </MessageTools>
  );
});

// --- Role-specific message components ---

interface UserMessageProps {
  isEditing: boolean;
  isInteractionLocked: boolean;
  message: MynthUiMessage;
  modelId: string | null;
}

const UserMessage = React.memo(function UserMessage({
  isEditing,
  isInteractionLocked,
  message,
  modelId,
}: UserMessageProps) {
  const onContextMenu = useMessageContextMenu(message.id);
  const startEditingMessage = useChatStartEditingMessage();
  const stopEditingMessage = useChatStopEditingMessage();
  const submitEditedMessage = useChatSubmitEditedMessage();
  const messageText = React.useMemo(() => getMessageText(message), [message]);
  const [draft, setDraft] = React.useState(messageText);

  React.useEffect(() => {
    if (!isEditing) {
      setDraft(messageText);
    }
  }, [isEditing, messageText]);

  return (
    <div className="group/message flex flex-col items-end gap-3">
      <div
        className="max-w-[75%] rounded-2xl bg-chat-user-bubble px-5 py-3 text-chat-user-bubble-foreground"
        onContextMenu={onContextMenu}
      >
        {isEditing ? (
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
        ) : (
          message.parts.map((part, i) =>
            part.type === "text" ? <UserMessageTextPart key={i} text={part.text} /> : null,
          )
        )}
      </div>

      <UserMessageTools
        draft={draft}
        isEditing={isEditing}
        isInteractionLocked={isInteractionLocked}
        messageId={message.id}
        messageText={messageText}
        modelId={modelId}
        onDraftChange={setDraft}
        startEditingMessage={startEditingMessage}
        stopEditingMessage={stopEditingMessage}
        submitEditedMessage={submitEditedMessage}
      />
    </div>
  );
});

interface AssistantMessageProps {
  isAnimating: boolean;
  isEditing: boolean;
  isInteractionLocked: boolean;
  message: MynthUiMessage;
}

const AssistantMessage = React.memo(function AssistantMessage({
  isAnimating,
  isEditing,
  isInteractionLocked,
  message,
}: AssistantMessageProps) {
  const startEditingMessage = useChatStartEditingMessage();
  const stopEditingMessage = useChatStopEditingMessage();
  const submitEditedMessage = useChatSubmitEditedMessage();
  const onContextMenu = useMessageContextMenu(message.id);
  const messageText = React.useMemo(() => getMessageText(message), [message]);
  const [draft, setDraft] = React.useState(messageText);

  React.useEffect(() => {
    if (!isEditing) {
      setDraft(messageText);
    }
  }, [isEditing, messageText]);

  return (
    <div className="group/message flex flex-col items-start gap-3">
      <div className="max-w-[90%] py-2" onContextMenu={onContextMenu}>
        {isEditing ? (
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
        ) : (
          message.parts.map((part, i) =>
            part.type === "text" ? (
              <AssistantMessageTextPart key={i} text={part.text} isAnimating={isAnimating} />
            ) : null,
          )
        )}
      </div>

      <AssistantMessageTools
        draft={draft}
        isEditing={isEditing}
        isInteractionLocked={isInteractionLocked}
        message={message}
        messageText={messageText}
        onDraftChange={setDraft}
        startEditingMessage={startEditingMessage}
        stopEditingMessage={stopEditingMessage}
        submitEditedMessage={submitEditedMessage}
      />
    </div>
  );
});

// --- Message dispatcher ---

interface ChatMessageProps {
  isAnimating: boolean;
  isEditing: boolean;
  isInteractionLocked: boolean;
  message: MynthUiMessage;
  modelId: string | null;
}

export const ChatMessage = React.memo(function ChatMessage({
  isAnimating,
  isEditing,
  isInteractionLocked,
  message,
  modelId,
}: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <UserMessage
        isEditing={isEditing}
        isInteractionLocked={isInteractionLocked}
        message={message}
        modelId={modelId}
      />
    );
  }

  return (
    <AssistantMessage
      isAnimating={isAnimating}
      isEditing={isEditing}
      isInteractionLocked={isInteractionLocked}
      message={message}
    />
  );
});

function getMessageText(message: MynthUiMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<MynthUiMessage["parts"][number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("\n");
}
