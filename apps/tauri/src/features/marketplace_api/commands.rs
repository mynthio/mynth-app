use anyhow::Error;

use crate::{
    features::marketplace_api::{dtos::MarketplaceApiProvider, service::MarketplaceApiService},
    AppState,
};

#[tauri::command]
pub async fn marketplace_api_list_providers() -> Vec<MarketplaceApiProvider> {
    let service = MarketplaceApiService::new();
    service.list_providers().await.unwrap()
}
