use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// Represents a branch in a chat conversation
/// Each chat can have multiple branches that fork from different points
#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Branch {
    pub id: String,
    pub name: Option<String>,
    pub chat_id: String,
    pub parent_id: Option<String>,
    pub branched_from_node_id: Option<String>,
    pub branched_from_node_at: Option<chrono::NaiveDateTime>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}
