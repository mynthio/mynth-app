use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, TS)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./chat/chat-context-inheritance-mode.type.ts")]
pub enum ChatContextInheritanceMode {
    Inherit,
    Override,
    None,
    Workspace,
}

impl From<String> for ChatContextInheritanceMode {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid context inheritance mode: {}", s))
    }
}

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
    pub context_inheritance_mode: ChatContextInheritanceMode,
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
