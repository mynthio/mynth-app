use super::{
    dtos::{Chat, UpdateChat, UpdateChatPublic},
    repository::ChatRepository,
    service::ChatService,
};
use crate::{
    features::{branch::repository::BranchRepository, workspace::repository::WorkspaceRepository},
    AppState,
};
use tauri::State;

#[tauri::command]
pub async fn get_all_chats<'a>(
    state: State<'a, AppState>,
    workspace_id: String,
) -> Result<Vec<Chat>, String> {
    let repository = ChatRepository::new(state.db_pool.clone());
    repository
        .get_all(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_chat<'a>(state: State<'a, AppState>, chat_id: String) -> Result<Chat, String> {
    let repository = ChatRepository::new(state.db_pool.clone());
    repository.get(&chat_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_chat<'a>(
    state: State<'a, AppState>,
    workspace_id: String,
    parent_id: Option<String>,
) -> Result<Chat, String> {
    let repository = ChatRepository::new(state.db_pool.clone());
    let service = ChatService::new(repository);

    let workspace_repository = WorkspaceRepository::new(state.db_pool.clone());
    let branch_repository = BranchRepository::new(state.db_pool.clone());

    service
        .create(
            state.db_pool.clone(),
            workspace_repository,
            branch_repository,
            workspace_id,
            parent_id,
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_chat<'a>(
    state: State<'a, AppState>,
    payload: UpdateChatPublic,
) -> Result<(), String> {
    let repository = ChatRepository::new(state.db_pool.clone());
    repository
        .update(UpdateChat::from(payload))
        .await
        .map_err(|e| e.to_string())
}
