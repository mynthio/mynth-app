import { ChatNode as ChatNodeType } from "../../../../types";
import { Card } from "../../../../ui/card";

type ChatNodeProps = {
  node: ChatNodeType;
};

export function ChatNode(props: ChatNodeProps) {
  return (
    <Card>
      <div
        class="prose w-full min-w-full max-w-full"
        innerHTML={props.node.activeMessage?.content}
      />
    </Card>
  );
}
