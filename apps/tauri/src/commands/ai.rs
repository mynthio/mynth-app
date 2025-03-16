use crate::models::ai::{AiIntegrationWithModels, CreateAiIntegrationParams, CreateAiModelParams};
use crate::services::ai::AiServiceError;
use crate::AppState;
use tracing::{error, info};

#[tauri::command]
pub async fn create_ai_integration(
    state: tauri::State<'_, AppState>,
    params: CreateAiIntegrationParams,
) -> Result<String, String> {
    info!("Command: create_ai_integration with name: {}", params.name);

    state
        .db
        .ai
        .create_integration(params)
        .await
        .map_err(|e| match e {
            AiServiceError::InvalidParameter(msg) => {
                error!("Invalid parameter: {}", msg);
                format!("Invalid input: {}", msg)
            }
            AiServiceError::Database(err) => {
                error!("Database error: {}", err);
                format!("Database error occurred: {}", err)
            }
            _ => e.to_string(),
        })
}

#[tauri::command]
pub async fn create_ai_model(
    state: tauri::State<'_, AppState>,
    params: CreateAiModelParams,
) -> Result<String, String> {
    info!(
        "Command: create_ai_model with model ID: {}",
        params.model_id
    );

    state.db.ai.create_model(params).await.map_err(|e| match e {
        AiServiceError::InvalidParameter(msg) => {
            error!("Invalid parameter: {}", msg);
            format!("Invalid input: {}", msg)
        }
        AiServiceError::Database(err) => {
            error!("Database error: {}", err);
            format!("Database error occurred: {}", err)
        }
        _ => e.to_string(),
    })
}

#[tauri::command]
pub async fn get_ai_integrations(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<AiIntegrationWithModels>, String> {
    info!("Command: get_ai_integrations");

    state
        .db
        .ai
        .get_integrations_with_models()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_integration(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Option<AiIntegrationWithModels>, String> {
    info!("Command: get_ai_integration with ID: {}", id);

    state
        .db
        .ai
        .get_integration(&id)
        .await
        .map_err(|e| e.to_string())
}
