use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
#[ts(export, export_to = "./provider/provider-auth-type.type.ts")]
pub enum ProviderAuthType {
    None,
    Bearer,
    Custom,
}

impl From<String> for ProviderAuthType {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider auth type: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString, sqlx::Type, TS)]
#[strum(serialize_all = "snake_case")]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "snake_case")]
#[ts(export, export_to = "./provider/provider-models-sync-strategy.type.ts")]
pub enum ProviderModelsSyncStrategy {
    Mynth,
    Local,
}

impl From<String> for ProviderModelsSyncStrategy {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider models sync strategy: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow, TS)]
#[ts(export, export_to = "./provider/provider.type.ts")]

pub struct Provider {
    pub id: String,
    pub marketplace_id: Option<String>,
    pub name: String,
    pub base_url: String,
    pub auth_type: ProviderAuthType,
    pub api_key_id: Option<String>,
    pub json_keys: Option<String>,
    pub json_variables: Option<String>,
    pub json_auth_config: Option<String>,
    pub models_sync_strategy: ProviderModelsSyncStrategy,
    #[ts(type = "string")]
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewProvider {
    pub id: Option<String>,
    pub marketplace_id: Option<String>,
    pub name: String,
    pub base_url: String,
    pub auth_type: ProviderAuthType,
    pub json_auth_config: Option<String>,
    pub models_sync_strategy: ProviderModelsSyncStrategy,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpdateProvider {
    pub id: String,
    pub marketplace_id: Option<String>,
    pub name: Option<String>,
    pub base_url: Option<String>,
    pub auth_type: Option<ProviderAuthType>,
    pub api_key_id: Option<String>,
    pub json_auth_config: Option<String>,
    pub models_sync_strategy: Option<ProviderModelsSyncStrategy>,
}
