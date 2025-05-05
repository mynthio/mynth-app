use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, TS)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(
    export,
    export_to = "./workspace/workspace-context-inheritance-mode.type.ts"
)]
pub enum WorkspaceContextInheritanceMode {
    Inherit,
    Override,
    None,
}

impl From<String> for WorkspaceContextInheritanceMode {
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
    pub context_inheritance_mode: WorkspaceContextInheritanceMode,
    #[ts(type = "string")]
    pub updated_at: NaiveDateTime,
}
