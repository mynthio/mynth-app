use crate::services::api_client;

#[tauri::command]
pub async fn get_providers() -> Result<Vec<api_client::Provider>, String> {
    api_client::get_providers().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_provider_models(provider_id: String) -> Result<Vec<api_client::Model>, String> {
    api_client::get_provider_models(&provider_id)
        .await
        .map_err(|e| e.to_string())
}
