use serde::{Deserialize, Serialize};
use std::time::Instant;
use tauri::ipc::Channel;
use ts_rs::TS;

// Import UsageInfo from ai_client module for the usage event payload
use crate::features::ai_client::dtos::UsageInfo;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionStatus {
    Initializing,
    Active,         // Session is actively handling events
    Processing,     // Doing some work after primary events, before completing
    Completed,      // Successfully finished
    Failed(String), // Errored out
    Cancelled,      // Cancelled by user or system
}

// Generic event session that can handle any payload type
#[derive(Clone)]
pub struct EventSession<T> {
    pub id: String,
    pub status: SessionStatus,
    pub channel: Option<Channel<T>>,
    pub last_active: Instant,
}

impl<T> EventSession<T> {
    pub fn new(id: String, channel: Option<Channel<T>>) -> Self {
        EventSession {
            id,
            channel,
            status: SessionStatus::Initializing,
            last_active: Instant::now(),
        }
    }
}

// Chat-specific event payload for streaming chat events
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export, export_to = "./event-sessions/chat-event-payload.type.ts")]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum ChatEventPayload {
    /// Streaming content chunk - contains message data
    Chunk {
        chat_id: String,
        branch_id: String,
        message_id: String,
        message_content: String,
        delta: String,
    },
    /// Usage information from the AI provider
    Usage {
        chat_id: String,
        branch_id: String,
        usage_data: UsageInfo,
    },
    /// Session completion - no additional payload needed
    Done { chat_id: String, branch_id: String },
}

// Type alias for chat event sessions
pub type ChatEventSession = EventSession<ChatEventPayload>;

// Public info struct for chat sessions (without sensitive channel data)
#[derive(Debug, Clone, Serialize)]
pub struct ChatSessionInfo {
    pub id: String,
    pub status: SessionStatus,
}

impl From<&ChatEventSession> for ChatSessionInfo {
    fn from(session: &ChatEventSession) -> Self {
        ChatSessionInfo {
            id: session.id.clone(),
            status: session.status.clone(),
        }
    }
}
