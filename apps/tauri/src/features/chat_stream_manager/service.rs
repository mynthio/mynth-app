// src/chat_stream_manager/service.rs (updated path context)
use dashmap::DashMap;
// Removed Serialize import as T is no longer used in a way that requires it here
// use serde::Serialize;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{ipc::Channel, Wry};
use tokio::task::AbortHandle;

// Updated to use new DTO names: ActiveChatStream and ChatStreamInfo
use super::dtos::{ActiveChatStream, ChatStreamEventPayload, ChatStreamInfo, StreamStatus};

const DEFAULT_STREAM_TIMEOUT_SECONDS: u64 = 60 * 5; // 5 minutes

// Renamed to ChatStreamManager to reflect its specific purpose for chat streams.
// It now specifically manages streams of type defined in StreamInfo (currently Channel<String>).
pub struct ChatStreamManager {
    // Arc allows multiple owners for the DashMap,
    // DashMap handles internal concurrency for managing streams.
    active_streams: Arc<DashMap<String, ActiveChatStream>>, // Uses ActiveChatStream
}

// impl block for ChatStreamManager
impl ChatStreamManager {
    pub fn new() -> Self {
        let streams = Arc::new(DashMap::new());
        let manager = ChatStreamManager {
            active_streams: streams.clone(),
        };

        // TODO: Spawn a cleanup task if background cleanup of timed-out streams is desired.
        // // tokio::spawn(async move {
        // //     Self::periodic_cleanup(streams).await;
        // // });

        manager
    }

    // add_stream now expects Channel<String> as per the updated StreamInfo definition
    pub fn add_stream(
        &self,
        id: String,
        channel: Option<Channel<ChatStreamEventPayload>>, // Specifically Channel<String>
    ) -> Result<(), String> {
        if self.active_streams.contains_key(&id) {
            return Err(format!("Stream with id '{}' already exists.", id));
        }
        // Use ActiveChatStream::new
        let stream_info = ActiveChatStream::new(id.clone(), channel);
        self.active_streams.insert(id.clone(), stream_info);
        println!("Stream added: {}", id);
        Ok(())
    }

    pub fn update_status(&self, id: &str, status: StreamStatus) {
        if let Some(mut entry) = self.active_streams.get_mut(id) {
            entry.status = status.clone();
            entry.last_active = Instant::now();
            println!("Stream status updated for {}: {:?}", id, status);
        }
    }

    pub fn update_channel(&self, id: &str, channel: Channel<ChatStreamEventPayload>) {
        if let Some(mut entry) = self.active_streams.get_mut(id) {
            entry.channel = Some(channel);
        }
    }

    pub fn record_activity(&self, id: &str) {
        if let Some(mut entry) = self.active_streams.get_mut(id) {
            entry.last_active = Instant::now();
        }
    }

    // remove_stream returns Option<ActiveChatStream>
    pub fn remove_stream(&self, id: &str) -> Option<ActiveChatStream> {
        let removed = self.active_streams.remove(id);
        if removed.is_some() {
            println!("Stream removed: {}", id);
        }
        removed.map(|(_k, v)| v)
    }

    pub fn get_stream(&self, id: &str) -> Option<ActiveChatStream> {
        self.active_streams
            .get(id)
            .map(|entry| entry.value().clone())
    }

    // get_stream_info returns Option<ChatStreamInfo>
    pub fn get_stream_info(&self, id: &str) -> Option<ChatStreamInfo> {
        self.active_streams
            .get(id)
            .map(|entry| ChatStreamInfo::from(entry.value())) // Use ChatStreamInfo::from
    }

    // get_all_active_streams returns Vec<ChatStreamInfo>
    pub fn get_all_active_streams(&self) -> Vec<ChatStreamInfo> {
        self.active_streams
            .iter()
            .map(|entry| ChatStreamInfo::from(entry.value())) // Use ChatStreamInfo::from
            .collect()
    }

    // pub fn cancel_stream(&self, id: &str) -> Result<(), String> {
    //     if let Some(entry) = self.active_streams.get(id) {
    //         if !matches!(
    //             entry.status,
    //             StreamStatus::Completed | StreamStatus::Failed(_) | StreamStatus::Cancelled
    //         ) {
    //             // entry.abort_handle.abort();
    //             println!("Stream cancellation requested for: {}", id);
    //             return Ok(());
    //         }
    //         Err(format!("Stream {} is already completed or failed.", id))
    //     } else {
    //         Err(format!("Stream {} not found for cancellation.", id))
    //     }
    // }

    // The periodic_cleanup function is commented out as per user changes.
    // If re-enabled, it would use ActiveChatStream.
    // TODO: Implement if needed
    // async fn periodic_cleanup(streams: Arc<DashMap<String, ActiveChatStream>>) {
    //     // ... implementation would use ActiveChatStream ...
    // }
}
