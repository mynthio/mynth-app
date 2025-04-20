use std::collections::HashMap;
use tauri::ipc::Channel;
use tokio::sync::Mutex;
use tracing::{debug, warn};

use crate::services::message_events::MessageEvent;

/// Registry to keep track of active message generation streams
pub struct StreamRegistry {
    streams: Mutex<HashMap<String, Channel<MessageEvent>>>,
    message_history: Mutex<HashMap<String, String>>,
}

impl StreamRegistry {
    pub fn new() -> Self {
        StreamRegistry {
            streams: Mutex::new(HashMap::new()),
            message_history: Mutex::new(HashMap::new()),
        }
    }

    pub async fn add_stream(&self, branch_id: &str, channel: Channel<MessageEvent>) {
        // Check if we already have a stream for this branch_id and log a warning
        let mut streams = self.streams.lock().await;
        if streams.contains_key(branch_id) {
            warn!("Overwriting existing stream for branch ID: {}", branch_id);
        }

        // Store the channel with the branch_id as key
        debug!("Adding stream for branch ID: {}", branch_id);
        streams.insert(branch_id.to_string(), channel);
    }

    pub async fn get_stream(&self, branch_id: &str) -> Option<Channel<MessageEvent>> {
        let streams = self.streams.lock().await;
        let stream = streams.get(branch_id).cloned();
        debug!(
            "Stream for branch ID {} found: {}",
            branch_id,
            stream.is_some()
        );
        stream
    }

    pub async fn remove_stream(&self, branch_id: &str) {
        debug!("Removing stream for branch ID: {}", branch_id);
        self.streams.lock().await.remove(branch_id);
        self.message_history.lock().await.remove(branch_id);
    }

    pub async fn append_to_history(&self, branch_id: &str, message: &str) {
        let mut history = self.message_history.lock().await;
        history
            .entry(branch_id.to_string())
            .or_insert_with(String::new)
            .push_str(message);
    }

    pub async fn get_history(&self, branch_id: &str) -> Option<String> {
        self.message_history.lock().await.get(branch_id).cloned()
    }
}
