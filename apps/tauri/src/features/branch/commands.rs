use tauri::State;

use crate::{features::branch::dtos::Branch, AppState};

use super::{dtos::UpdateBranch, repository::BranchRepository, service::BranchService};

#[tauri::command]
pub async fn get_branch<'a>(
    state: State<'a, AppState>,
    branch_id: String,
) -> Result<Branch, String> {
    let repository = BranchRepository::new(state.db_pool.clone());
    repository.get(&branch_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn branch_get_all_by_chat_id<'a>(
    state: State<'a, AppState>,
    chat_id: String,
) -> Result<Vec<Branch>, String> {
    let repository = BranchRepository::new(state.db_pool.clone());
    repository
        .get_all_by_chat_id(&chat_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_branch<'a>(
    state: State<'a, AppState>,
    branch: UpdateBranch,
) -> Result<Branch, String> {
    let repository = BranchRepository::new(state.db_pool.clone());

    repository.update(branch).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clone_branch<'a>(
    state: State<'a, AppState>,
    branch_id: String,
    after_node_id: Option<String>,
) -> Result<Branch, String> {
    let service = BranchService::new(state.db_pool.clone());

    service
        .clone(branch_id, after_node_id)
        .await
        .map_err(|e| e.to_string())
}
