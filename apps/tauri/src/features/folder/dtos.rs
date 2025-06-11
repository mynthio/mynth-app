use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};

#[derive(Debug, Serialize, Deserialize, Display, EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum FolderContextInheritanceMode {
    Inherit,
    Override,
    None,
    Workspace,
}

impl From<String> for FolderContextInheritanceMode {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid context inheritance mode: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub workspace_id: String,
    pub context: Option<String>,
    pub context_inheritance_mode: FolderContextInheritanceMode,
    pub is_archived: bool,
    pub archived_at: Option<NaiveDateTime>,
    pub updated_at: NaiveDateTime,
}
