use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ModelSettings {
    pub id: String,
    pub settings: Option<String>,
    pub model_id: String,
    pub workspace_id: String,
    pub folder_id: String,
    pub chat_id: String,
    pub updated_at: Option<NaiveDateTime>,
}
