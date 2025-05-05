use super::{core::AiGenerationCore, service::AiGenerationService};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn generate_text<'a>(
    state: State<'a, AppState>,
    branch_id: String,
    message: String,
) -> Result<(), String> {
    let service = AiGenerationService::new(state.db_pool.clone());
    let core = AiGenerationCore::new(service);
    core.generate(&branch_id, &message)
        .await
        .map_err(|e| e.to_string())
}
