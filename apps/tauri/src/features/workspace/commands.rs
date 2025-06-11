use crate::{
    features::workspace::dtos::{Workspace, WorkspaceConfig},
    AppState,
};
use tauri::State;

use super::repository::WorkspaceRepository;

#[tauri::command]
pub async fn get_workspace<'a>(
    state: State<'a, AppState>,
    workspace_id: String,
) -> Result<Option<Workspace>, String> {
    let repository = WorkspaceRepository::new(state.db_pool.clone());
    repository
        .get(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_workspaces<'a>(state: State<'a, AppState>) -> Result<Vec<Workspace>, String> {
    let repository = WorkspaceRepository::new(state.db_pool.clone());
    repository.get_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_workspace_config<'a>(
    state: State<'a, AppState>,
    workspace_id: String,
) -> Result<WorkspaceConfig, String> {
    let repository = WorkspaceRepository::new(state.db_pool.clone());
    repository
        .select_config(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}
