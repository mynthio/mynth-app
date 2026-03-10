import * as React from "react";
import { Background, Controls, MiniMap, ReactFlow, type NodeMouseHandler } from "@xyflow/react";
import type { MynthUiMessage } from "@shared/chat/message-metadata";

import { buildChatGraphLayout } from "./chat-graph-layout";
import { ChatGraphNodeView } from "./chat-graph-node";

import "@xyflow/react/dist/style.css";

const nodeTypes = {
  message: ChatGraphNodeView,
};

const MINIMAP_COLORS = {
  active: "#3f7a5f",
  default: "#5b6270",
  selected: "#d4d4d8",
};

interface ChatGraphCanvasProps {
  activeMessageIds: ReadonlySet<string>;
  messages: readonly MynthUiMessage[];
  onSelectBranch: (messageId: string) => void;
  selectedMessageId: string | null;
}

export function ChatGraphCanvas({
  activeMessageIds,
  messages,
  onSelectBranch,
  selectedMessageId,
}: ChatGraphCanvasProps) {
  const { edges, nodes } = React.useMemo(
    () => buildChatGraphLayout(messages, activeMessageIds, selectedMessageId),
    [activeMessageIds, messages, selectedMessageId],
  );

  const handleNodeClick = React.useCallback<NodeMouseHandler>(
    (_event, node) => {
      onSelectBranch(node.id);
    },
    [onSelectBranch],
  );

  return (
    <div className="h-full w-full bg-background">
      <ReactFlow
        key={messages.at(-1)?.id ?? "empty"}
        colorMode="dark"
        fitView
        fitViewOptions={{ duration: 300, padding: 0.28 }}
        edges={edges}
        elementsSelectable={false}
        maxZoom={1.6}
        minZoom={0.2}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        onlyRenderVisibleElements
        onNodeClick={handleNodeClick}
        panOnScroll
      >
        <Background color="var(--color-border)" gap={24} size={1} />
        <MiniMap
          bgColor="#171717"
          className="!overflow-hidden !rounded-xl !border !border-border !shadow-sm"
          maskColor="rgba(10, 10, 10, 0.72)"
          maskStrokeColor="#525252"
          maskStrokeWidth={1.5}
          nodeBorderRadius={6}
          nodeColor={(node) => {
            if (node.data?.isSelected) {
              return MINIMAP_COLORS.selected;
            }

            if (node.data?.isActivePath) {
              return MINIMAP_COLORS.active;
            }

            return MINIMAP_COLORS.default;
          }}
          nodeStrokeColor="#0a0a0a"
          nodeStrokeWidth={2}
          pannable
          zoomable
        />
        <Controls
          className="!overflow-hidden !rounded-xl !border !border-border !bg-card !shadow-sm [&_.react-flow__controls-button]:!h-10 [&_.react-flow__controls-button]:!w-10 [&_.react-flow__controls-button]:!border-border [&_.react-flow__controls-button]:!bg-card [&_.react-flow__controls-button]:!text-foreground [&_.react-flow__controls-button:hover]:!bg-muted [&_.react-flow__controls-button:hover]:!text-foreground [&_.react-flow__controls-button_svg]:!fill-current"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
