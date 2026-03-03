import * as React from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

import type { MynthUiMessage } from "@shared/chat/message-metadata";
import {
  useChatIsBusy,
  useChatRegenerateMessage,
  useChatSwitchBranch,
  useIsAnimatingMessage,
} from "@/features/chat/chat-context";
import { useTextContextMenu } from "@/hooks/use-text-context-menu";

import "streamdown/styles.css";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Refresh04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Group } from "@/components/ui/group";

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
  const isBusy = useChatIsBusy();
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
        disabled={isBusy}
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
            disabled={isBusy || !prevSiblingId}
            onClick={() => prevSiblingId && void switchBranch(prevSiblingId)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Button>
          <Button
            disabled={isBusy}
            size="sm"
            className="text-primary-foreground font-light sm:text-xs"
          >
            {siblingIndex + 1}/{siblings.length}
          </Button>
          <Button
            size="icon-sm"
            disabled={isBusy || !nextSiblingId}
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

const UserMessage = React.memo(function UserMessage({
  message,
}: UserMessageProps) {
  const onContextMenu = useTextContextMenu();

  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        onContextMenu={onContextMenu}
      >
        {message.parts.map((part, i) =>
          part.type === "text" ? (
            <UserMessageTextPart key={i} text={part.text} />
          ) : null,
        )}
      </div>
    </div>
  );
});

interface AssistantMessageProps {
  message: MynthUiMessage;
}

const AssistantMessage = React.memo(function AssistantMessage({
  message,
}: AssistantMessageProps) {
  const isAnimating = useIsAnimatingMessage(message.id, message.role);
  const onContextMenu = useTextContextMenu();

  return (
    <div className="group/message flex flex-col items-start gap-3">
      <div
        className="max-w-[80%] rounded-lg py-2 text-sm"
        onContextMenu={onContextMenu}
      >
        {message.parts.map((part, i) =>
          part.type === "text" ? (
            <AssistantMessageTextPart
              key={i}
              text={part.text}
              isAnimating={isAnimating}
            />
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

export const ChatMessage = React.memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return <AssistantMessage message={message} />;
});
