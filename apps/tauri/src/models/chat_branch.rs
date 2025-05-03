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
    pub model_id: Option<String>,
    /// Flexible context for this branch (e.g., system prompt, docs, files in future)
    /// Can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
    pub context: Option<String>,
    /// How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
    /// 'workspace' means inherit from workspace.
    pub context_inheritance_mode: String,
    pub branched_from_node_id: Option<String>,
    pub branched_from_node_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

/// Parameters for updating a chat branch
#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBranchParams {
    pub name: Option<String>,
    pub model_id: Option<String>,
}
