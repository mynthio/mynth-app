use tauri::{ipc::Channel, State};

use crate::AppState;

use super::dtos::ChatStreamEventPayload;

#[tauri::command]
pub fn connect_chat_stream<'a>(
    state: State<'a, AppState>,
    id: String,
    channel: Channel<ChatStreamEventPayload>,
) -> Result<(), String> {
    state.stream_manager.update_channel(&id, channel);
    Ok(())
}
