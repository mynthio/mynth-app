use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use strum_macros::{Display, EnumString};

#[derive(Debug, Serialize, Deserialize, Display, EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum ProviderCompatibility {
    None,
    OpenAI,
}

impl From<String> for ProviderCompatibility {
    fn from(s: String) -> Self {
        s.parse()
            .unwrap_or_else(|_| panic!("Invalid provider compatibility: {}", s))
    }
}

#[derive(Debug, Serialize, Deserialize, Display, EnumString)]
#[strum(serialize_all = "snake_case")]
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

#[derive(Debug, Serialize, Deserialize, Display, EnumString)]
#[strum(serialize_all = "snake_case")]
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

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub base_url: String,
    pub compatibility: ProviderCompatibility,
    pub auth_type: ProviderAuthType,
    pub auth_config: Option<String>,
    pub models_sync_strategy: ProviderModelsSyncStrategy,
    pub updated_at: NaiveDateTime,
}
