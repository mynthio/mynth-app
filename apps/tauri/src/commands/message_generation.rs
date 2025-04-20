use crate::models::chat::ChatMessagePair;
use crate::services::message_events::MessageEvent;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use tracing::info;

/// Send a message and get a generated response
///
/// This command sends a user message to a chat branch and uses the provided channel for streaming the AI response.
///
/// @param branch_id - The ID of the branch to send the message to
/// @param message - The content of the user's message
/// @param on_event - Channel to stream the AI's generated response
/// @returns ChatMessagePair containing the created user and assistant nodes
#[tauri::command]
pub async fn send_message(
    state: tauri::State<'_, AppState>,
    branch_id: String,
    message: String,
    on_event: Channel<MessageEvent>,
) -> Result<ChatMessagePair, String> {
    info!(
        "Command: send_message with branch ID: {}, message: {}",
        branch_id, message
    );

    state
        .db
        .message_generation
        .send_message(&branch_id, &message, on_event)
        .await
        .map_err(|e| e.to_string())
}

/// Response for reconnect command
#[derive(Serialize, Deserialize)]
pub enum ReconnectResponse {
    /// Successfully reconnected to active stream
    Success,
    /// No active stream found for the branch
    NoActiveStream,
}

impl From<crate::services::message_generation::ReconnectResponse> for ReconnectResponse {
    fn from(response: crate::services::message_generation::ReconnectResponse) -> Self {
        match response {
            crate::services::message_generation::ReconnectResponse::Success => Self::Success,
            crate::services::message_generation::ReconnectResponse::NoActiveStream => {
                Self::NoActiveStream
            }
        }
    }
}

/// Reconnect to an existing chat stream with a new channel
///
/// This command reconnects to an ongoing message generation stream for a branch with a new channel.
/// If there's no active streaming for the branch, it returns a message indicating that.
///
/// @param branch_id - The ID of the branch to reconnect to
/// @param on_event - New channel to stream the AI's generated response
/// @returns ReconnectResponse indicating success or no active stream
#[tauri::command]
pub async fn reconnect(
    state: tauri::State<'_, AppState>,
    branch_id: String,
    on_event: Channel<MessageEvent>,
) -> Result<ReconnectResponse, String> {
    info!("Command: reconnect with branch ID: {}", branch_id);

    let response = state
        .db
        .message_generation
        .reconnect(&branch_id, on_event)
        .await;

    Ok(response.into())
}

/// Unregister an active stream for a branch
///
/// This command removes the channel for a branch from the stream registry.
///
/// @param branch_id - The ID of the branch to unregister
#[tauri::command]
pub async fn unregister_stream(
    state: tauri::State<'_, AppState>,
    branch_id: String,
) -> Result<(), String> {
    info!("Command: unregister_stream with branch ID: {}", branch_id);
    state
        .db
        .message_generation
        .unregister_stream(&branch_id)
        .await;
    Ok(())
}

/// Regenerate a response for an existing message
///
/// This command regenerates the AI response for a given user message node in a branch, using the provided channel for streaming.
///
/// @param branch_id - The ID of the branch
/// @param user_node_id - The ID of the user message node to regenerate a response for
/// @param message - The content of the user's message
/// @param on_event - Channel to stream the AI's generated response
#[tauri::command]
pub async fn regenerate_message(
    state: tauri::State<'_, AppState>,
    branch_id: String,
    user_node_id: String,
    message: String,
    on_event: Channel<MessageEvent>,
) -> Result<(), String> {
    info!(
        "Command: regenerate_message with branch ID: {}, user_node_id: {}, message: {}",
        branch_id, user_node_id, message
    );
    state
        .db
        .message_generation
        .regenerate_message(&branch_id, &user_node_id, &message, on_event)
        .await
        .map_err(|e| e.to_string())
}
