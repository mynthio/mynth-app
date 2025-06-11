use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./node-message/node-message.type.ts")]
pub struct NodeMessage {
    pub id: String,
    pub content: String,
    pub version_number: i64,
    pub status: String,
    pub node_id: String,
    pub model_id: Option<String>,
    pub token_count: Option<i64>,
    pub cost: Option<f64>,
    pub json_api_metadata: Option<String>,
    pub json_extensions: Option<String>,
    #[ts(type = "string")]
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewNodeMessage {
    pub id: Option<String>,
    pub node_id: String,
    pub content: String,
    pub version_number: i64,
    pub status: String,
    pub model_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNodeMessage {
    pub id: String,
    pub content: Option<String>,
    pub status: Option<String>,
}
