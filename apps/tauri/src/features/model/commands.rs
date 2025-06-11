use tauri::State;

use crate::AppState;

use super::{
    dtos::{Model, UpdateModel, UpdateModelPublic},
    repository::ModelRepository,
};

// remember to call `.manage(MyState::default())`
#[tauri::command]
pub async fn get_model<'a>(state: State<'a, AppState>, model_id: String) -> Result<Model, String> {
    let repository = ModelRepository::new(state.db_pool.clone());

    repository.get(&model_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_models<'a>(state: State<'a, AppState>) -> Result<Vec<Model>, String> {
    let repository = ModelRepository::new(state.db_pool.clone());

    repository.get_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_model<'a>(
    state: State<'a, AppState>,
    payload: UpdateModelPublic,
) -> Result<(), String> {
    let repository = ModelRepository::new(state.db_pool.clone());

    let update_model = UpdateModel {
        id: payload.id,
        display_name: payload.display_name,
        is_pinned: payload.is_pinned,
        is_favourite: payload.is_favourite,
        ..Default::default()
    };

    repository
        .update(update_model)
        .await
        .map_err(|e| e.to_string())
}
