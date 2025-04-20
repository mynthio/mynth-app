use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ContextAssignment {
    pub id: String,
    pub context_id: String,
    pub workspace_id: String,
    pub folder_id: String,
    pub chat_id: String,
    pub apply_order: Option<i32>,
    pub updated_at: Option<NaiveDateTime>,
}
