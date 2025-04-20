use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub id: String,
    pub key: String,
    pub value: String,
    pub description: Option<String>,
    pub workspace_id: String,
    pub folder_id: String,
    pub chat_id: String,
    pub updated_at: Option<NaiveDateTime>,
}
