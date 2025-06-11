use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

use crate::features::workspace::dtos::WorkspaceItemContextInheritanceMode;

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./chat/chat.type.ts")]
pub struct Chat {
    // ID
    pub id: String,
    // Name
    pub name: String,
    // Workspace ID
    pub workspace_id: String,
    // Parent ID
    pub parent_id: Option<String>,
    // Current Branch ID
    pub current_branch_id: Option<String>,
    // Context
    pub context: Option<String>,
    // Context Inheritance Mode
    pub context_inheritance_mode: WorkspaceItemContextInheritanceMode,
    // MCP Enabled
    pub mcp_enabled: bool,
    // Is Archived
    pub is_archived: bool,
    // Archived At
    #[ts(type = "string")]
    pub archived_at: Option<NaiveDateTime>,
    // Metadata
    pub json_metadata: Option<String>,
    // Extensions
    pub json_extensions: Option<String>,
    // Updated At
    #[ts(type = "string")]
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewChat {
    // Name
    pub name: String,
    // Workspace ID
    pub workspace_id: String,
    // Parent ID
    pub parent_id: Option<String>,
    // Context Inheritance Mode
    pub context_inheritance_mode: Option<WorkspaceItemContextInheritanceMode>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChat {
    // ID
    pub id: String,
    // Name
    pub name: Option<String>,
    // Workspace ID
    pub workspace_id: Option<String>,
    // Parent ID
    pub parent_id: Option<String>,
    // Current Branch ID
    pub current_branch_id: Option<String>,
    // Context
    pub context: Option<String>,
    // Context Inheritance Mode
    pub context_inheritance_mode: Option<WorkspaceItemContextInheritanceMode>,
    // MCP Enabled
    pub mcp_enabled: Option<bool>,
    // Is Archived
    pub is_archived: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "./chat/update-chat.type.ts",
    rename = "UpdateChat"
)]
pub struct UpdateChatPublic {
    // ID
    pub id: String,
    // Name
    pub name: Option<String>,
    // Current Branch ID
    pub current_branch_id: Option<String>,
}

// 🦀 Rusty way: Implement From trait for easy conversion
// This allows you to use `UpdateChat::from(public_chat)` or `public_chat.into()`
impl From<UpdateChatPublic> for UpdateChat {
    fn from(public: UpdateChatPublic) -> Self {
        UpdateChat {
            id: public.id,
            name: public.name,
            current_branch_id: public.current_branch_id,
            // All other fields default to None/default values
            workspace_id: None,
            parent_id: None,
            context: None,
            context_inheritance_mode: None,
            mcp_enabled: None,
            is_archived: None,
        }
    }
}
