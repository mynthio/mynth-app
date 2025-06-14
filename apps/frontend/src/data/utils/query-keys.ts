import { Accessor } from 'solid-js'

export const GET_WORKSPACES_KEYS = ['workspaces']

export const GET_CHATS_KEYS = ({
  workspaceId,
}: {
  workspaceId: Accessor<string>
}) => ['chats', workspaceId()]

export const GET_WORKSPACE_BY_ID_KEYS = ({
  workspaceId,
}: {
  workspaceId: Accessor<string>
}) => ['workspaces', workspaceId()]

export const GET_CHAT_KEYS = ({ chatId }: { chatId: Accessor<string> }) => [
  'chats',
  chatId(),
]

export const GET_CHAT_FOLDER_KEYS = ({
  folderId,
}: {
  folderId: Accessor<string>
}) => ['chat-folders', folderId()]

export const GET_CHAT_FOLDERS_KEYS = ({
  workspaceId,
}: {
  workspaceId: Accessor<string>
}) => ['chat-folders', workspaceId()]

export const GET_CHAT_BRANCH_KEYS = ({
  branchId,
}: {
  branchId: Accessor<string>
}) => ['chat-branches', branchId()]

export const GET_CHAT_BRANCHES_KEYS = ({
  chatId,
}: {
  chatId: Accessor<string>
}) => ['chat-branches', chatId()]

export const GET_CHAT_BRANCH_NODES_KEYS = ({
  branchId,
  afterNodeId,
}: {
  branchId: Accessor<string>
  afterNodeId?: Accessor<string | null>
}) =>
  afterNodeId
    ? ['chat-branch-nodes', branchId(), afterNodeId()]
    : ['chat-branch-nodes', branchId()]

export const GET_AI_INTEGRATIONS_KEYS = () => ['ai-integrations']

export const GET_AI_INTEGRATION_BY_ID_KEYS = ({
  aiIntegrationId,
}: {
  aiIntegrationId: Accessor<string>
}) => ['ai-integrations', aiIntegrationId()]

export const GET_AI_MODELS_KEYS = ({
  aiIntegrationId,
}: {
  aiIntegrationId?: Accessor<string | null>
} = {}) => (aiIntegrationId ? ['ai-models', aiIntegrationId()] : ['ai-models'])

export const PROVIDER_KEYS = () => ['providers']

export const GET_PROVIDER_BY_ID_KEYS = ({
  providerId,
}: {
  providerId: Accessor<string>
}) => ['providers', providerId()]

export const GET_PROVIDER_MODELS_KEYS = ({
  providerId,
}: {
  providerId: Accessor<string>
}) => ['provider-models', providerId()]

export const MODELS_KEYS = () => ['models']
export const MODEL_KEYS = ({ modelId }: { modelId: Accessor<string> }) => [
  'models',
  modelId(),
]

export const BRANCH_KEYS = ({ branchId }: { branchId: Accessor<string> }) => [
  'branches',
  branchId(),
]
export const BRANCHES_BY_CHAT_ID_KEYS = ({
  chatId,
}: {
  chatId: Accessor<string>
}) => ['branches', chatId()]

export const NODE_MESSAGES_BY_NODE_ID_KEYS = ({
  nodeId,
}: {
  nodeId: Accessor<string>
}) => ['node-messages', nodeId()]
