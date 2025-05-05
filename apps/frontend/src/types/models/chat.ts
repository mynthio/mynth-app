import { DateTime } from '../common'

/**
 * Represents a chat folder in the application
 * Maps to ChatFolder struct in Rust backend
 */
export interface ChatFolder {
  id: string
  name: string
  parentId?: string
  workspaceId?: string
}

/**
 * Represents a chat list item (summarized chat) in the application
 * Maps to ChatListItem struct in Rust backend
 */
interface ChatListItem {
  id: string
  name: string
  parentId?: string
  workspaceId?: string
  updatedAt?: DateTime
}

/**
 * Parameters for updating a chat
 * Maps to UpdateChatParams in Rust backend
 */
interface UpdateChatParams {
  name?: string
  parentId?: string
}

/**
 * Parameters for updating a chat folder
 * Maps to UpdateFolderParams in Rust backend
 */
interface UpdateFolderParams {
  name?: string
  parentId?: string
}

/**
 * Represents a full chat in the application
 * Maps to Chat struct in Rust backend
 */
export interface Chat {
  id: string
  name: string
  parentId?: string
  workspaceId?: string
  currentBranchId?: string
  isArchived?: boolean
  archivedAt?: DateTime
  createdAt?: DateTime
  updatedAt?: DateTime
}

/**
 * Represents a chat branch in the application
 * Maps to Branch struct in Rust backend
 */
export interface Branch {
  id: string
  name?: string
  chatId: string
  parentId?: string
  branchedFromNodeId?: string
  branchedFromNodeAt?: DateTime
  createdAt?: DateTime
  updatedAt?: DateTime
}

/**
 * Represents a content version of a chat node
 * Maps to ContentVersion struct in Rust backend
 */
interface Message {
  id: string
  content: string
  versionNumber: number
}

/**
 * Type of chat node
 */
type NodeType =
  | 'user_message'
  | 'assistant_message'
  | 'user_note'
  | 'assistant_note'

/**
 * Represents a chat node in the application
 * Maps to ChatNode struct in Rust backend
 */
export interface ChatNode {
  id: string
  nodeType: NodeType
  branchId: string
  parentId?: string
  modelId?: string
  activeMessageId?: string
  updatedAt?: DateTime
  activeMessage?: Message
  messageCount?: number
}

/**
 * Response for paginated chat nodes
 * Maps to ChatNodesResponse in Rust backend
 */
export interface ChatNodesResponse {
  nodes: ChatNode[]
  hasMore: boolean
}

/**
 * Represents a list of chat branches in the application
 * Maps to ChatBranch struct in Rust backend
 */
export interface ChatBranch {
  id: string
  name?: string
  chatId: string
  parentId?: string
  branchedFromNodeId?: string
  branchedFromNodeAt?: DateTime
  createdAt?: DateTime
  updatedAt?: DateTime
}

/**
 * Represents a pair of user message and assistant message nodes
 * Maps to ChatMessagePair struct in Rust backend
 */
export interface ChatMessagePair {
  userNode: ChatNode
  assistantNode: ChatNode
}
