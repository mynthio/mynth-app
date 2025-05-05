use crate::{services::workspace::dtos::Workspace, AppState};
use tauri::State;

use super::service::WorkspaceService;

#[tauri::command]
pub async fn get_workspace<'a>(
    state: State<'a, AppState>,
    workspace_id: String,
) -> Result<Option<Workspace>, String> {
    let service = WorkspaceService::new(state.db_pool.clone());
    service.get(&workspace_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_workspaces<'a>(state: State<'a, AppState>) -> Result<Vec<Workspace>, String> {
    let service = WorkspaceService::new(state.db_pool.clone());
    service.get_all().await.map_err(|e| e.to_string())
}
