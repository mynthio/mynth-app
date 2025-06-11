use dashmap::DashMap;
use serde::Serialize;
use std::sync::Arc;
use std::time::Instant;
use tauri::ipc::Channel;

use super::dtos::{EventSession, SessionStatus};

// Generic event session manager with static utility methods
// Works with any event session type through generics
pub struct EventSessionManager;

impl EventSessionManager {
    /// Create a new event session
    pub fn create<T>(
        sessions: &Arc<DashMap<String, EventSession<T>>>,
        id: String,
        channel: Channel<T>,
    ) -> Result<(), String>
    where
        T: Clone + Send + Sync + 'static,
    {
        if sessions.contains_key(&id) {
            return Err(format!("Session with id '{}' already exists.", id));
        }

        let session = EventSession::new(id.clone(), Some(channel));
        sessions.insert(id.clone(), session);
        println!("Event session created: {}", id);
        Ok(())
    }

    /// Update an existing session (status and activity)
    pub fn update<T>(
        sessions: &Arc<DashMap<String, EventSession<T>>>,
        id: &str,
        status: Option<SessionStatus>,
        channel: Option<Channel<T>>,
    ) -> Result<(), String>
    where
        T: Clone + Send + Sync + 'static,
    {
        if let Some(mut entry) = sessions.get_mut(id) {
            if let Some(new_status) = status {
                entry.status = new_status.clone();
                println!("Session status updated for {}: {:?}", id, new_status);
            }
            if let Some(new_channel) = channel {
                entry.channel = Some(new_channel);
                println!("Channel connected to session: {}", id);
            }
            entry.last_active = Instant::now();
            Ok(())
        } else {
            Err(format!("Session with id '{}' not found.", id))
        }
    }

    /// Delete a session and return it if it existed
    pub fn delete<T>(
        sessions: &Arc<DashMap<String, EventSession<T>>>,
        id: &str,
    ) -> Option<EventSession<T>>
    where
        T: Clone + Send + Sync + 'static,
    {
        let removed = sessions.remove(id);
        if removed.is_some() {
            println!("Event session removed: {}", id);
        }
        removed.map(|(_k, v)| v)
    }

    /// Get a session by ID (returns a clone)
    pub fn get<T>(
        sessions: &Arc<DashMap<String, EventSession<T>>>,
        id: &str,
    ) -> Option<EventSession<T>>
    where
        T: Clone + Send + Sync + 'static,
    {
        sessions.get(id).map(|entry| entry.value().clone())
    }

    /// Send an event through the session's channel
    /// Returns an error if the session doesn't exist or doesn't have a channel connected
    pub fn send_event<T>(
        sessions: &Arc<DashMap<String, EventSession<T>>>,
        id: &str,
        event: T,
    ) -> Result<(), String>
    where
        T: Clone + Send + Sync + Serialize + 'static,
    {
        if let Some(mut entry) = sessions.get_mut(id) {
            if let Some(ref channel) = entry.channel {
                // Attempt to send the event through the channel
                match channel.send(event) {
                    Ok(_) => {
                        // Update last activity timestamp on successful send
                        entry.last_active = Instant::now();
                        println!("Event sent successfully to session: {}", id);
                        Ok(())
                    }
                    Err(_) => {
                        // Channel send failed - likely disconnected
                        Err(format!(
                            "Failed to send event to session '{}': channel may be disconnected",
                            id
                        ))
                    }
                }
            } else {
                Err(format!("Session '{}' has no active channel connected", id))
            }
        } else {
            Err(format!("Session with id '{}' not found", id))
        }
    }
}
