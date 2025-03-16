import { Accessor } from "solid-js";

export const GET_WORKSPACES_KEYS = ["workspaces"];

export const GET_WORKSPACE_BY_ID_KEYS = ({
  workspaceId,
}: {
  workspaceId: Accessor<string>;
}) => ["workspaces", workspaceId()];

export const GET_CHAT_KEYS = ({ chatId }: { chatId: Accessor<string> }) => [
  "chats",
  chatId(),
];

export const GET_CHAT_BRANCH_KEYS = ({
  branchId,
}: {
  branchId: Accessor<string>;
}) => ["chat-branches", branchId()];

export const GET_CHAT_BRANCHES_KEYS = ({
  chatId,
}: {
  chatId: Accessor<string>;
}) => ["chat-branches", chatId()];

export const GET_CHAT_BRANCH_NODES_KEYS = ({
  branchId,
  afterNodeId,
}: {
  branchId: Accessor<string>;
  afterNodeId?: Accessor<string | null>;
}) =>
  afterNodeId
    ? ["chat-branch-nodes", branchId(), afterNodeId()]
    : ["chat-branch-nodes", branchId()];
