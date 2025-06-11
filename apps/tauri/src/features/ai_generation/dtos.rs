use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::features::{
    provider_endpoint::dtos::ProviderEndpointCompatibility,
    workspace::dtos::WorkspaceItemContextInheritanceMode,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InitialCtx {
    // CHAT
    pub chat_id: String,
    pub chat_context: Option<String>,
    pub chat_context_inheritance_mode: WorkspaceItemContextInheritanceMode,
    // BRANCH
    pub branch_id: String,
    // MODEL
    pub model_id: String,
    pub model_name: String,
    pub model_request_template: Option<String>,
    pub model_max_input_tokens: Option<i64>,
    // PROVIDER
    pub provider_id: String,
    pub provider_base_url: String,
    // ENDPOINT
    pub endpoint_id: String,
    pub endpoint_path: String,
    pub endpoint_method: String,
    pub endpoint_compatibility: ProviderEndpointCompatibility,
    pub endpoint_request_template: Option<String>,
    pub endpoint_request_schema: Option<String>,
    pub endpoint_response_schema: Option<String>,
    pub endpoint_request_config: Option<String>,
    pub endpoint_response_config: Option<String>,
    pub endpoint_streaming: bool,
}

impl InitialCtx {
    pub fn validate(&self) -> Result<()> {
        if self.model_request_template.is_none() && self.endpoint_request_template.is_none() {
            bail!("Model and endpoint request templates are both empty");
        }

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize, Default, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "./ai-generation/regenerate-node-payload.type.ts",
    rename = "RegenerateNodePayload"
)]
pub struct RegenerateNodePayload {
    // Node ID
    pub id: String,

    // Overwrites
    // Overwrite model
    pub overwrite_model_id: Option<String>,
}
