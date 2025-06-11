// src/chat_stream_manager/dtos.rs (updated path context)
use serde::Serialize;
use std::time::Instant;
use strum_macros::{Display, EnumString};
use tauri::ipc::Channel;
use ts_rs::TS;

// Import UsageInfo from ai_client module for the usage event payload
use crate::features::ai_client::dtos::UsageInfo;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum StreamStatus {
    Initializing,
    Active,         // Streaming data
    Processing,     // Doing some work after primary stream, before completing
    Completed,      // Successfully finished
    Failed(String), // Errored out
    Cancelled,      // Cancelled by user or system
}

// Renamed from PublicStreamInfo to ChatStreamInfo
#[derive(Debug, Clone, Serialize)]
pub struct ChatStreamInfo {
    id: String,
    status: StreamStatus,
}

// ChatStreamEvent is no longer needed as the event type is now embedded in ChatStreamEventPayload variants
// Keeping this commented for reference in case it's used elsewhere
// #[derive(Debug, Clone, Serialize, EnumString, Display, TS)]
// #[strum(serialize_all = "snake_case")]
// #[serde(rename_all = "snake_case")]
// #[ts(export, export_to = "./chat-stream-manager/chat-stream-event.type.ts")]
// pub enum ChatStreamEvent {
//     Chunk,
//     Usage,
//     Done,
// }

#[derive(Debug, Clone, Serialize, TS)]
#[ts(
    export,
    export_to = "./chat-stream-manager/chat-stream-event-payload.type.ts"
)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum ChatStreamEventPayload {
    /// Streaming content chunk - contains message data
    Chunk {
        chat_id: String,
        branch_id: String,
        message_id: String,
        message_content: String,
    },
    /// Usage information from the AI provider
    Usage {
        chat_id: String,
        branch_id: String,
        usage_data: UsageInfo,
    },
    /// Stream completion - no additional payload needed
    Done { chat_id: String, branch_id: String },
}

// Updated From implementation for new names
impl From<&ActiveChatStream> for ChatStreamInfo {
    fn from(info: &ActiveChatStream) -> Self {
        ChatStreamInfo {
            id: info.id.clone(),
            status: info.status.clone(),
        }
    }
}

// Renamed from StreamInfo to ActiveChatStream
#[derive(Clone)]
pub struct ActiveChatStream {
    pub id: String,
    pub status: StreamStatus,
    pub channel: Option<Channel<ChatStreamEventPayload>>, // Channel for String data (chat messages/events)
    pub last_active: Instant,
}

// Impl block for ActiveChatStream
impl ActiveChatStream {
    pub fn new(id: String, channel: Option<Channel<ChatStreamEventPayload>>) -> Self {
        ActiveChatStream {
            id,
            channel,
            status: StreamStatus::Initializing,
            last_active: Instant::now(),
        }
    }
}
