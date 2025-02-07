use crate::models::ai::{AiIntegrationWithModels, CreateAiIntegrationParams, CreateAiModelParams};
use crate::AppState;

#[tauri::command]
pub async fn create_ai_integration(
    state: tauri::State<'_, AppState>,
    params: CreateAiIntegrationParams,
) -> Result<String, String> {
    state
        .db
        .ai
        .create_integration(params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_ai_model(
    state: tauri::State<'_, AppState>,
    params: CreateAiModelParams,
) -> Result<String, String> {
    state
        .db
        .ai
        .create_model(params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_integrations(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<AiIntegrationWithModels>, String> {
    state
        .db
        .ai
        .fetch_integrations_with_models()
        .await
        .map_err(|e| e.to_string())
}
