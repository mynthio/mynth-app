use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS, Clone)]
#[strum(serialize_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[ts(export, export_to = "./mcp-servers/mcp-server-type.type.ts")]
pub enum McpServerType {
    Mcp,
    Api,
}

impl From<String> for McpServerType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid MCP server type: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "./mcp-servers/mcp-server.type.ts")]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub command: String,
    pub arguments: Option<String>,
    pub env: Option<String>,
    pub settings: Option<String>,
    pub r#type: McpServerType,
    pub is_enabled: bool,
    pub is_enabled_globally: bool,
    pub is_custom: bool,
    pub description: Option<String>,
    pub credits: Option<String>,
    pub url: Option<String>,
    pub marketplace_id: Option<String>,
    pub metadata: Option<String>,
    #[ts(type = "string")]
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize)]
pub struct NewServer {
    pub id: Option<String>,
    pub name: String,
    pub display_name: Option<String>,
    pub command: String,
    pub arguments: Option<String>,
    pub env: Option<String>,
    pub settings: Option<String>,
    pub r#type: Option<McpServerType>,
    pub is_enabled: Option<bool>,
    pub is_custom: Option<bool>,
    pub description: Option<String>,
    pub credits: Option<String>,
    pub url: Option<String>,
    pub marketplace_id: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Serialize, Deserialize, Default)]
pub struct UpdateServer {
    pub id: String,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub command: Option<String>,
    pub arguments: Option<String>,
    pub env: Option<String>,
    pub settings: Option<String>,
    pub r#type: Option<McpServerType>,
    pub is_enabled: Option<bool>,
    pub is_custom: Option<bool>,
    pub description: Option<String>,
    pub credits: Option<String>,
    pub url: Option<String>,
    pub marketplace_id: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "./servers/update-server.type.ts",
    rename = "UpdateServer"
)]
pub struct UpdateServerPublic {
    pub id: String,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub is_enabled: Option<bool>,
    pub description: Option<String>,
    pub settings: Option<String>,
}

impl From<UpdateServerPublic> for UpdateServer {
    fn from(public: UpdateServerPublic) -> Self {
        UpdateServer {
            id: public.id,
            name: public.name,
            display_name: public.display_name,
            is_enabled: public.is_enabled,
            description: public.description,
            settings: public.settings,
            ..Default::default()
        }
    }
}
