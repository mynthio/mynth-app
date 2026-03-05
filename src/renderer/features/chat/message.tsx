import * as React from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

import type { MynthUiMessage } from "@shared/chat/message-metadata";
import {
  useChatIsInteractionLocked,
  useChatModelId,
  useChatRegenerateMessage,
  useChatStartEditingMessage,
  useChatStopEditingMessage,
  useChatSubmitEditedMessage,
  useChatSwitchBranch,
  useChatEditingMessageId,
  useIsAnimatingMessage,
} from "@/features/chat/chat-context";
import { useTextContextMenu } from "@/hooks/use-text-context-menu";

import "streamdown/styles.css";
import { ArrowLeft01Icon, ArrowRight01Icon, Refresh04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Group } from "@/components/ui/group";
import { Textarea } from "@/components/ui/textarea";
import { Toolbar, ToolbarGroup } from "@/components/ui/toolbar";

// --- Text parts ---

interface UserMessageTextPartProps {
  text: string;
}

const UserMessageTextPart = React.memo(function UserMessageTextPart({
  text,
}: UserMessageTextPartProps) {
  return (
    <Streamdown plugins={{ code }} className="text-[1.1rem] text-foreground">
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
      plugins={{ code }}
      animated
      isAnimating={isAnimating}
      className="text-[1.1rem] text-card-foreground"
    >
      {text}
    </Streamdown>
  );
});

// --- Role-specific tools components ---
interface AssistantMessageToolsProps {
  message: MynthUiMessage;
}

const AssistantMessageTools = React.memo(function AssistantMessageTools({
  message,
}: AssistantMessageToolsProps) {
  const isInteractionLocked = useChatIsInteractionLocked();
  const regenerate = useChatRegenerateMessage();
  const switchBranch = useChatSwitchBranch();

  const siblings = message.metadata?.siblings ?? [];
  const siblingIndex = message.metadata?.siblingIndex ?? 0;
  const prevSiblingId = siblings[siblingIndex - 1];
  const nextSiblingId = siblings[siblingIndex + 1];
  const hasSiblings = siblings.length > 1;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        "opacity-0 transition-opacity duration-150 group-hover/message:opacity-100",
      )}
    >
      <Button
        size="icon-sm"
        disabled={isInteractionLocked}
        onClick={() => {
          regenerate({ messageId: message.id });
        }}
      >
        <HugeiconsIcon icon={Refresh04Icon} />
      </Button>

      {hasSiblings && (
        <Group>
          <Button
            size="icon-sm"
            disabled={isInteractionLocked || !prevSiblingId}
            onClick={() => prevSiblingId && void switchBranch(prevSiblingId)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Button>
          <Button
            disabled={isInteractionLocked}
            size="sm"
            className="text-primary-foreground font-light sm:text-xs"
          >
            {siblingIndex + 1}/{siblings.length}
          </Button>
          <Button
            size="icon-sm"
            disabled={isInteractionLocked || !nextSiblingId}
            onClick={() => nextSiblingId && void switchBranch(nextSiblingId)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        </Group>
      )}
    </div>
  );
});

// --- Role-specific message components ---

interface UserMessageProps {
  message: MynthUiMessage;
}

const UserMessage = React.memo(function UserMessage({ message }: UserMessageProps) {
  const onContextMenu = useTextContextMenu();
  const modelId = useChatModelId();
  const editingMessageId = useChatEditingMessageId();
  const isInteractionLocked = useChatIsInteractionLocked();
  const startEditingMessage = useChatStartEditingMessage();
  const stopEditingMessage = useChatStopEditingMessage();
  const submitEditedMessage = useChatSubmitEditedMessage();
  const isEditing = editingMessageId === message.id;
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
        className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
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

      <Toolbar>
        <ToolbarGroup>
          {isEditing ? (
            <>
              <Button
                size="xs"
                disabled={!modelId || !draft.trim()}
                onClick={() => {
                  void submitEditedMessage(message.id, draft);
                }}
              >
                Save
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  setDraft(messageText);
                  stopEditingMessage();
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="xs"
              variant="secondary"
              disabled={isInteractionLocked}
              onClick={() => startEditingMessage(message.id)}
            >
              Edit
            </Button>
          )}
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
});

interface AssistantMessageProps {
  message: MynthUiMessage;
}

const AssistantMessage = React.memo(function AssistantMessage({ message }: AssistantMessageProps) {
  const isAnimating = useIsAnimatingMessage(message.id, message.role);
  const onContextMenu = useTextContextMenu();

  return (
    <div className="group/message flex flex-col items-start gap-3">
      <div className="max-w-[80%] rounded-lg py-2 text-sm" onContextMenu={onContextMenu}>
        {message.parts.map((part, i) =>
          part.type === "text" ? (
            <AssistantMessageTextPart key={i} text={part.text} isAnimating={isAnimating} />
          ) : null,
        )}
      </div>

      <AssistantMessageTools message={message} />
    </div>
  );
});

// --- Message dispatcher ---

interface ChatMessageProps {
  message: MynthUiMessage;
}

export const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return <AssistantMessage message={message} />;
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
