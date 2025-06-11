use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

// 🔧 Tool Status Enum - because even alien tools need proper status tracking!
#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./tools/tool-status.type.ts")]
pub enum ToolStatus {
    Enabled,
    Disabled,
}

impl From<String> for ToolStatus {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid tool status: {}", s))
    }
}

// 🛡️ Tool Allowance Enum - permission levels for our galactic toolbox
#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./tools/tool-allowance.type.ts")]
pub enum ToolAllowance {
    Ask,   // Ask before using (safer for destructive tools)
    Allow, // Auto-allow usage (for trusted tools)
}

impl From<String> for ToolAllowance {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid tool allowance: {}", s))
    }
}

// 🌌 Node Tool Use Status - tracking the lifecycle of tool executions
#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./tools/node-tool-use-status.type.ts")]
pub enum NodeToolUseStatus {
    Pending,    // Tool execution queued
    InProgress, // Tool currently executing
    Done,       // Tool execution completed successfully
    Error,      // Tool execution failed
}

impl From<String> for NodeToolUseStatus {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid node tool use status: {}", s))
    }
}

// 🎛️ Entity Types for configuration overrides
#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./tools/entity-type.type.ts")]
pub enum EntityType {
    Workspace,
    Folder,
    Chat,
}

impl From<String> for EntityType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid entity type: {}", s))
    }
}

// 🔗 Configurable Types for settings matrix
#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./tools/configurable-type.type.ts")]
pub enum ConfigurableType {
    McpServer,
    Tool,
}

impl From<String> for ConfigurableType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid configurable type: {}", s))
    }
}

// 🛠️ Main Tool Struct - the core of our galactic toolbox!
#[derive(Debug, Serialize, Deserialize, FromRow, Clone, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./tools/tool.type.ts")]
pub struct Tool {
    pub id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub mcp_server_id: Option<String>,
    pub status: ToolStatus,
    pub allowance: ToolAllowance,
    pub is_enabled_globally: bool,
    pub is_destructive: Option<bool>,
    pub is_read_only: Option<bool>,
    pub annotations: Option<String>,
    pub input_schema: Option<String>,
    pub json_metadata: Option<String>,
    #[ts(type = "string")]
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./tools/active-tool.type.ts")]
pub struct ActiveTool {
    pub tool_id: String,
    pub name: String,
    pub mcp_server_id: Option<String>,
    pub mcp_server_name: Option<String>,
    pub input_schema: Option<String>,
}

// 🆕 New Tool Creation Struct - for spawning new tools in our arsenal
#[derive(Serialize, Deserialize)]
pub struct NewTool {
    pub id: Option<String>,
    pub name: String,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub mcp_server_id: Option<String>,
    pub status: Option<ToolStatus>,
    pub allowance: Option<ToolAllowance>,
    pub is_enabled_globally: Option<bool>,
    pub is_destructive: Option<bool>,
    pub is_read_only: Option<bool>,
    pub annotations: Option<String>,
    pub input_schema: Option<String>,
    pub json_metadata: Option<String>,
}

// 🔄 Update Tool Struct - for modifying existing tools
#[derive(Serialize, Deserialize, Default)]
pub struct UpdateTool {
    pub id: String,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub mcp_server_id: Option<String>,
    pub status: Option<ToolStatus>,
    pub allowance: Option<ToolAllowance>,
    pub is_enabled_globally: Option<bool>,
    pub is_destructive: Option<bool>,
    pub is_read_only: Option<bool>,
    pub annotations: Option<String>,
    pub input_schema: Option<String>,
    pub json_metadata: Option<String>,
}

// 🌐 Public Update Tool Struct - exposed to frontend for safe tool configuration
#[derive(Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "./tools/update-tool.type.ts",
    rename = "UpdateTool"
)]
pub struct UpdateToolPublic {
    pub id: String,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub status: Option<ToolStatus>,
    pub allowance: Option<ToolAllowance>,
    pub is_enabled_globally: Option<bool>,
    pub annotations: Option<String>,
    pub json_metadata: Option<String>,
}

impl From<UpdateToolPublic> for UpdateTool {
    fn from(public: UpdateToolPublic) -> Self {
        UpdateTool {
            id: public.id,
            name: public.name,
            display_name: public.display_name,
            description: public.description,
            status: public.status,
            allowance: public.allowance,
            is_enabled_globally: public.is_enabled_globally,
            annotations: public.annotations,
            json_metadata: public.json_metadata,
            ..Default::default()
        }
    }
}
