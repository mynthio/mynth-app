use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::str::FromStr;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum ChatNodeType {
    UserMessage,
    AssistantMessage,
    // Add other potential node types here if needed
    // SystemMessage,
    // ToolCall,
    // ToolResult,
}

impl ToString for ChatNodeType {
    fn to_string(&self) -> String {
        match self {
            ChatNodeType::UserMessage => "user_message".to_string(),
            ChatNodeType::AssistantMessage => "assistant_message".to_string(),
        }
    }
}

impl FromStr for ChatNodeType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "user_message" => Ok(ChatNodeType::UserMessage),
            "assistant_message" => Ok(ChatNodeType::AssistantMessage),
            _ => Err(format!("Unknown chat node type: {}", s)),
        }
    }
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatFolder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: String,
    /// Flexible context for this folder (e.g., system prompt, docs, files in future)
    /// Can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
    pub context: Option<String>,
    /// How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
    /// 'workspace' means inherit from workspace.
    pub context_inheritance_mode: String,
    pub is_archived: bool,
    pub archived_at: Option<NaiveDateTime>,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatListItem {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: Option<String>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(serde::Serialize, serde::Deserialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatParams {
    pub name: Option<String>,
    pub parent_id: Option<String>,
    pub workspace_id: Option<String>,
    pub current_branch_id: Option<String>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFolderParams {
    pub name: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Chat {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: Option<String>,
    pub current_branch_id: Option<String>,
    pub model_id: Option<String>,
    /// Flexible context for this chat (e.g., system prompt, docs, files in future)
    /// Can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
    pub context: Option<String>,
    /// How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
    /// 'workspace' means inherit from workspace.
    pub context_inheritance_mode: String,
    pub is_archived: bool,
    pub archived_at: Option<NaiveDateTime>,
    pub metadata: Option<String>,
    pub extensions: Option<String>,
    pub updated_at: NaiveDateTime,
}

/// Represents a single chat node in a chat branch
/// A node can be a user message, assistant message, user note, or assistant note
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatNode {
    pub id: String,
    pub node_type: String,
    pub branch_id: String,
    pub parent_id: Option<String>,
    pub active_message_id: Option<String>,
    pub active_tool_use_id: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
    pub extensions: Option<String>,
    // This field will be populated from a join with chat_node_messages
    #[sqlx(default)]
    pub active_message: Option<ContentVersion>,
    // This field will be populated from a join with chat_node_mcp_tool_use
    #[sqlx(default)]
    pub active_tool_use: Option<crate::models::mcp::ChatNodeMcpToolUse>,
    // Message count tracks the number of versions/messages for this node
    #[sqlx(default)]
    pub message_count: Option<i64>,
}

/// Represents a specific version of content for a chat node
/// Each chat node can have multiple versions of content as it evolves
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ContentVersion {
    pub id: String,
    pub content: String,
    pub version_number: i32,
    pub status: String,
    pub node_id: String,
    pub model_id: Option<String>,
    pub token_count: Option<i64>,
    pub cost: Option<f64>,
    pub api_metadata: Option<String>,
    pub extensions: Option<String>,
}

/// Response for paginated chat nodes
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatNodesResponse {
    pub nodes: Vec<ChatNode>,
    pub has_more: bool,
}

/// Represents a pair of user message and assistant message nodes
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessagePair {
    pub user_node: ChatNode,
    pub assistant_node: ChatNode,
}
