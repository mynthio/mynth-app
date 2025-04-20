use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub command: String,
    pub arguments: Option<String>,
    pub settings: Option<String>,
    pub status: String,
    pub description: Option<String>,
    pub credits: Option<String>,
    pub url: Option<String>,
    pub marketplace_id: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct McpServerTool {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub mcp_server_id: String,
    pub status: String,
    pub allowance: String,
    pub is_destructive: bool,
    pub is_read_only: bool,
    pub annotations: Option<String>,
    pub input_schema: Option<String>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatNodeMcpToolUse {
    pub id: String,
    pub input: Option<String>,
    pub output: Option<String>,
    pub status: String,
    pub error: Option<String>,
    pub version_number: i32,
    pub node_id: String,
    pub tool_id: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}
