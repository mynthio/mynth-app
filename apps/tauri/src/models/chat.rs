use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatFolder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: Option<String>,
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

#[derive(serde::Serialize, serde::Deserialize, Debug)]
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
    pub is_archived: Option<bool>,
    pub archived_at: Option<chrono::NaiveDateTime>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
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
    pub model_id: Option<String>,
    pub active_version_id: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
    // This field will be populated from a join with chat_node_content_versions
    #[sqlx(default)]
    pub active_version: Option<ContentVersion>,
}

/// Represents a specific version of content for a chat node
/// Each chat node can have multiple versions of content as it evolves
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ContentVersion {
    pub id: String,
    pub content: String,
    pub version_number: i32,
    pub node_id: String,
    pub created_at: Option<chrono::NaiveDateTime>,
}

/// Response for paginated chat nodes
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatNodesResponse {
    pub nodes: Vec<ChatNode>,
    pub has_more: bool,
}
