use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, TS, Clone, sqlx::Type)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[ts(export, export_to = "./workspace/workspace-item.type.ts")]
pub enum WorkspaceItemType {
    Workspace,
    Folder,
    Chat,
}

impl From<String> for WorkspaceItemType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid workspace item: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString, TS, Clone, sqlx::Type, PartialEq)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[ts(
    export,
    export_to = "./workspace/workspace-item-context-inheritance-mode.type.ts"
)]
pub enum WorkspaceItemContextInheritanceMode {
    None,
    Parent,
    Workspace,
}

// Default implementation - very rusty! 🦀
impl Default for WorkspaceItemContextInheritanceMode {
    fn default() -> Self {
        Self::None // sensible default: no inheritance by default
    }
}

impl From<String> for WorkspaceItemContextInheritanceMode {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid context inheritance mode: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./workspace/workspace.type.ts")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub context: Option<String>,
    #[ts(type = "string")]
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow, TS, Clone)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./workspace/workspace-item-context.type.ts")]
pub struct WorkspaceItemContext {
    pub item_type: WorkspaceItemType,
    pub item_id: String,
    pub context: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./workspace/workspace-config.type.ts")]
pub struct WorkspaceConfig {
    #[serde(rename(deserialize = "YeP"), default)]
    pub new_items_default_ctx_ihm: WorkspaceItemContextInheritanceMode,
}

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./workspace/workspace-select-config.type.ts")]
pub struct WorkspaceSelectConfig {
    #[ts(as = "Option<WorkspaceConfig>")]
    pub json_config: sqlx::types::Json<WorkspaceConfig>,
}
