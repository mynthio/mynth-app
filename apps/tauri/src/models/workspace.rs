use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    /// Flexible context for this workspace (e.g., system prompt, docs, files in future)
    /// Can be used for system prompt, docs, or anything else. More flexible than 'system_prompt'.
    pub context: Option<String>,
    /// How context is inherited: 'inherit', 'override', 'none', or 'workspace' (inherit from workspace)
    /// 'workspace' means inherit from workspace (makes sense for folders/chats/branches).
    pub context_inheritance_mode: String,
    pub updated_at: Option<NaiveDateTime>,
}
