use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Context {
    pub id: String,
    pub name: String,
    pub content: String,
    pub description: Option<String>,
    pub workspace_id: String,
    pub is_archived: bool,
    pub archived_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}
