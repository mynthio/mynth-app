use std::sync::Arc;

use anyhow::Error;
use sqlx::SqlitePool;
use tracing::debug;
use ulid::Ulid;

use crate::{
    features::{
        marketplace_api::service::MarketplaceApiService,
        model::{dtos::NewModel, repository::ModelRepository},
        provider::dtos::NewProvider,
        provider_endpoint::{dtos::NewProviderEndpoint, repository::ProviderEndpointRepository},
    },
    utils::keychain::store_api_key,
};

use super::{dtos::UpdateProvider, repository::ProviderRepository};

//
// SERVICE
//
pub struct ProviderService {
    provider_repository: ProviderRepository,
}

impl ProviderService {
    pub fn new(provider_repository: ProviderRepository) -> Self {
        Self {
            provider_repository,
        }
    }

    pub async fn update_api_key(
        &self,
        pool: Arc<SqlitePool>,
        provider_id: &str,
        api_key: &str,
    ) -> Result<(), Error> {
        let new_api_key_id = Ulid::new().to_string();

        let mut tx = pool.begin().await?;

        self.provider_repository
            .update_with_executor(
                &mut *tx,
                UpdateProvider {
                    id: provider_id.to_string(),
                    api_key_id: Some(new_api_key_id.clone()),
                    ..Default::default()
                },
            )
            .await?;

        store_api_key(&new_api_key_id, api_key);

        tx.commit().await?;

        // TODO: Remvoe old API key from keychain

        Ok(())
    }

    pub async fn integrate(
        &self,
        pool: Arc<SqlitePool>,
        provider_endpoint_repository: ProviderEndpointRepository,
        model_repository: ModelRepository,
        marketplace_api_service: MarketplaceApiService,
        provider_marketplace_id: &str,
    ) -> Result<(), Error> {
        // let provider_integration = marketplace_api_service
        //     .fetch_provider_integration(provider_marketplace_id.to_string())
        //     .await?;

        // debug!(
        //     provider_integration = ?provider_integration,
        //     "ProviderService::integrate provider integration"
        // );

        // let provider_id = Ulid::new().to_string();

        // let new_provider = NewProvider {
        //     id: Some(provider_id.clone()),
        //     marketplace_id: Some(provider_integration.provider.id),
        //     name: "TODO: NAME".to_string(),
        //     base_url: provider_integration.provider.base_url,
        //     auth_type: provider_integration.provider.auth_type.into(),
        //     json_auth_config: None,
        //     models_sync_strategy: provider_integration.provider.models_sync_strategy.into(),
        // };

        // debug!(
        //     new_provider = ?new_provider,
        //     "ProviderService::integrate new provider"
        // );

        // let new_provider_endpoints: Vec<NewProviderEndpoint> = provider_integration
        //     .provider_endpoints
        //     .into_iter()
        //     .map(|provider_endpoint| NewProviderEndpoint {
        //         id: None,
        //         provider_id: provider_id.clone(),
        //         marketplace_id: Some(provider_endpoint.id),
        //         r#type: provider_endpoint.r#type.into(),
        //         display_name: provider_endpoint.display_name,
        //         path: provider_endpoint.path,
        //         method: provider_endpoint.method.into(),
        //         compatibility: provider_integration.provider.compatibility.into(),
        //         request_template: provider_endpoint.request_template,
        //         json_request_schema: provider_endpoint.json_request_schema,
        //         json_response_schema: provider_endpoint.json_response_schema,
        //         json_request_config: None,
        //         json_response_config: None,
        //         streaming: provider_endpoint.streaming,
        //         priority: provider_endpoint.priority.map(|p| p as i64),
        //         json_config: provider_endpoint.json_config,
        //     })
        //     .collect();

        // debug!(
        //     new_provider_endpoints = ?new_provider_endpoints,
        //     "ProviderService::integrate new provider endpoints"
        // );

        // let new_models: Vec<NewModel> = provider_integration
        //     .models
        //     .into_iter()
        //     .map(|model| NewModel {
        //         id: None,
        //         marketplace_id: Some(model.id),
        //         name: model.name,
        //         display_name: Some(model.display_name),
        //         max_input_tokens: model.max_input_tokens.map(|t| t as i64),
        //         input_price: model.input_price,
        //         output_price: model.output_price,
        //         tags: model.tags.map(|t| t.join(",")),
        //         request_template: model.request_template,
        //         source: "TODO: SOURCE".to_string(),
        //         is_hidden: false,
        //         json_config: model.json_config,
        //         json_metadata_v1: model.json_metadata_v1,
        //     })
        //     .collect();

        // debug!(
        //     new_models = ?new_models,
        //     "ProviderService::integrate new models"
        // );

        // let mut tx = pool.begin().await?;

        // self.provider_repository
        //     .create_with_executor(&mut *tx, new_provider)
        //     .await?;

        // provider_endpoint_repository
        //     .create_many_with_executor(&mut *tx, new_provider_endpoints)
        //     .await
        //     .inspect_err(|e| debug!(error = ?e, "Error"));

        // model_repository
        //     .create_many_with_executor(&mut *tx, new_models)
        //     .await?;

        // tx.commit().await?;

        Ok(())
    }
}
