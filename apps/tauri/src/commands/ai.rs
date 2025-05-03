use super::error::CommandError;
use crate::models::ai::{
    AiIntegration, CreateAiIntegrationParams, UpdateAiIntegrationApiKeyParams,
};
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
pub async fn get_ai_integrations(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<AiIntegration>, String> {
    info!("Command: get_ai_integrations");

    state
        .db
        .ai
        .get_integrations()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_integration(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Option<AiIntegration>, String> {
    info!("Command: get_ai_integration with ID: {}", id);

    state
        .db
        .ai
        .get_integration(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_ai_integration(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    info!("Command: delete_ai_integration with ID: {}", id);

    state
        .db
        .ai
        .delete_integration(&id)
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
pub async fn get_ai_models(
    state: tauri::State<'_, AppState>,
    ai_integration_id: Option<String>,
) -> Result<Vec<crate::models::ai::AiModel>, CommandError> {
    info!(
        "Command: get_ai_models{}",
        if let Some(id) = &ai_integration_id {
            format!(" with integration ID: {}", id)
        } else {
            "".to_string()
        }
    );

    let integration_id_ref = ai_integration_id.as_deref();

    state
        .db
        .ai
        .get_models(integration_id_ref)
        .await
        .map_err(|e| {
            error!("Service error in get_ai_models: {:?}", e);
            CommandError::from(e)
        })
}

#[tauri::command]
pub async fn set_ai_integration_api_key(
    state: tauri::State<'_, AppState>,
    params: UpdateAiIntegrationApiKeyParams,
) -> Result<(), String> {
    info!(
        "Command: set_ai_integration_api_key for ID: {}",
        params.integration_id
    );

    state
        .db
        .ai
        .set_api_key(&params.integration_id, &params.api_key)
        .await
        .map_err(|e| match e {
            AiServiceError::InvalidParameter(msg) => {
                error!("Invalid parameter: {}", msg);
                format!("Invalid input: {}", msg)
            }
            AiServiceError::NotFound(msg) => {
                error!("Not found: {}", msg);
                format!("Not found: {}", msg)
            }
            AiServiceError::Database(err) => {
                error!("Database error: {}", err);
                format!("Database error occurred: {}", err)
            }
            _ => e.to_string(),
        })
}
