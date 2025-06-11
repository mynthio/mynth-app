use anyhow::Error;
use tauri::State;

use crate::{
    features::{
        marketplace_api::service::MarketplaceApiService, model::repository::ModelRepository,
        provider_endpoint::repository::ProviderEndpointRepository,
        workspace::repository::WorkspaceRepository,
    },
    AppState,
};

use super::{dtos::Provider, repository::ProviderRepository, service::ProviderService};

#[tauri::command]
pub async fn get_provider<'a>(state: State<'a, AppState>, id: &str) -> Result<Provider, String> {
    let repository = ProviderRepository::new(state.db_pool.clone());

    repository.get(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_providers<'a>(state: State<'a, AppState>) -> Result<Vec<Provider>, String> {
    let repository = ProviderRepository::new(state.db_pool.clone());

    repository.get_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_provider_api_key<'a>(
    state: State<'a, AppState>,
    provider_id: &str,
    api_key: &str,
) -> Result<(), String> {
    let repository = ProviderRepository::new(state.db_pool.clone());
    let service = ProviderService::new(repository);

    service
        .update_api_key(state.db_pool.clone(), provider_id, api_key)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn integrate_provider<'a>(
    state: State<'a, AppState>,
    marketplace_provider_id: String,
) -> Result<(), String> {
    let repository = ProviderRepository::new(state.db_pool.clone());
    let service = ProviderService::new(repository);

    let provider_endpoint_repository = ProviderEndpointRepository::new(state.db_pool.clone());
    let model_repository = ModelRepository::new(state.db_pool.clone());

    let marketplace_api_service = MarketplaceApiService::new();

    service
        .integrate(
            state.db_pool.clone(),
            provider_endpoint_repository,
            model_repository,
            marketplace_api_service,
            &marketplace_provider_id,
        )
        .await
        .map_err(|e| e.to_string());

    Ok(())
}
