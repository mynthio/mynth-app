use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./nodes/node-type.type.ts")]
pub enum NodeType {
    Message,
    Note,
    ToolUse,
}

impl From<String> for NodeType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider compatibility: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[ts(export, export_to = "./nodes/node-role.type.ts")]
pub enum NodeRole {
    User,
    Assistant,
}

impl From<String> for NodeRole {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider compatibility: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./nodes/node.type.ts")]
pub struct Node {
    pub id: String,
    pub r#type: NodeType,
    pub role: NodeRole,
    pub branch_id: String,
    pub message_id: Option<String>,
    pub message_content: Option<String>,
    pub message_model_id: Option<String>,
    pub message_version_number: Option<i64>,
    pub message_version_count: Option<i64>,
    // TODO: pub tool_use_id: Option<String>,
    pub extensions: Option<String>,
    #[ts(type = "string")]
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize)]
pub struct NewNode {
    pub id: Option<String>,
    pub r#type: NodeType,
    pub role: NodeRole,
    pub branch_id: String,
    pub active_message_id: Option<String>,
    pub active_tool_use_id: Option<String>,
    pub extensions: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize, Deserialize, Default)]
pub struct UpdateNode {
    pub id: String,
    pub r#type: Option<NodeType>,
    pub role: Option<NodeRole>,
    pub branch_id: Option<String>,
    pub active_message_id: Option<String>,
    pub active_tool_use_id: Option<String>,
    pub extensions: Option<String>,
}

#[derive(Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "./nodes/update-node.type.ts",
    rename = "UpdateNode"
)]
pub struct UpdateNodePublic {
    pub id: String,
    pub active_message_id: Option<String>,
}

impl From<UpdateNodePublic> for UpdateNode {
    fn from(public: UpdateNodePublic) -> Self {
        UpdateNode {
            id: public.id,
            active_message_id: public.active_message_id,
            ..Default::default()
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewChatPairUserNode {
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewChatPairAssistantNode {
    pub content: String,
    pub model_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewChatPair {
    pub user_node: NewChatPairUserNode,
    pub assistant_node: NewChatPairAssistantNode,
}
