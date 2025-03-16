use crate::models::workspace::Workspace;
use crate::AppState;

#[tauri::command]
pub async fn get_workspace(
    state: tauri::State<'_, AppState>,
    workspace_id: String,
) -> Result<Option<Workspace>, String> {
    state
        .db
        .workspaces
        .get_workspace(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_workspaces(state: tauri::State<'_, AppState>) -> Result<Vec<Workspace>, String> {
    state
        .db
        .workspaces
        .get_all_workspaces()
        .await
        .map_err(|e| e.to_string())
}
