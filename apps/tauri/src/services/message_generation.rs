use futures::StreamExt;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::sync::Arc;
use tauri::ipc::Channel;
use tracing::{debug, error, info};

use crate::models::chat::ChatMessagePair;
use crate::models::node_type::NodeType;
use crate::services::ai_client::{AIClient, AIConfig};
use crate::services::chat_node::ChatNodeService;
use crate::services::chat_node_message::ChatNodeMessageService;
use crate::services::database::DbPool;
use crate::services::message_events::MessageEvent;
use crate::services::stream_registry::StreamRegistry;
use crate::utils::markdown::markdown_to_html;

/// Response for reconnect operation
#[derive(Debug, Serialize, Deserialize)]
pub enum ReconnectResponse {
    /// Successfully reconnected to active stream
    Success,
    /// No active stream found for the branch
    NoActiveStream,
}

/// Service responsible for generating messages and managing message-related operations
pub struct MessageGenerationService {
    pool: Arc<DbPool>,
    registry: Arc<StreamRegistry>,
    ai_client: AIClient,
    chat_node_service: ChatNodeService,
    message_service: ChatNodeMessageService,
}

impl MessageGenerationService {
    /// Create a new message generation service with default configuration
    pub fn new(pool: Arc<DbPool>, chat_node_service: ChatNodeService) -> Self {
        debug!("Creating new MessageGenerationService with default AI config");
        Self::with_config(pool, chat_node_service, AIConfig::default())
    }

    /// Create a new message generation service with custom AI configuration
    pub fn with_config(
        pool: Arc<DbPool>,
        chat_node_service: ChatNodeService,
        ai_config: AIConfig,
    ) -> Self {
        debug!(
            "Creating MessageGenerationService with custom AI config: {:?}",
            ai_config
        );
        let pool_clone = Arc::clone(&pool);
        Self {
            pool,
            registry: Arc::new(StreamRegistry::new()),
            ai_client: AIClient::new(ai_config),
            chat_node_service,
            message_service: ChatNodeMessageService::new(pool_clone),
        }
    }

    /// Send a user message and generate a response
    ///
    /// This function:
    /// 1. Inserts the user message as a new node with content
    /// 2. Creates an empty assistant node immediately
    /// 3. Returns both the user node and assistant node in a ChatMessagePair
    /// 4. Uses the provided channel for streaming AI responses
    pub async fn send_message(
        &self,
        branch_id: &str,
        message: &str,
        channel: Channel<MessageEvent>,
    ) -> sqlx::Result<ChatMessagePair> {
        info!("Processing message for branch ID: {}", branch_id);
        debug!("User message content: {}", message);
        debug!("Channel ID: {:?}", channel.id());

        // Insert the user message using the chat node service
        let user_node_id = self
            .chat_node_service
            .create_node(
                branch_id,
                NodeType::UserMessage.as_str(),
                message,
                None, // No parent message
            )
            .await?;

        info!("Successfully added user message with ID: {}", user_node_id);

        // Create an empty assistant node immediately
        let assistant_node_id = self
            .chat_node_service
            .create_node(
                branch_id,
                NodeType::AssistantMessage.as_str(),
                "",                  // Empty content initially
                Some(&user_node_id), // Parent is the user message
            )
            .await?;

        info!(
            "Created empty assistant node with ID: {}",
            assistant_node_id
        );

        // Check for an active stream
        if self.registry.get_stream(branch_id).await.is_some() {
            debug!(
                "Found existing stream for branch ID: {}, removing it",
                branch_id
            );
            // Remove the existing stream if there is one
            self.registry.remove_stream(branch_id).await;
        }

        // Add stream to registry
        debug!("Adding stream to registry for branch ID: {}", branch_id);
        self.registry.add_stream(branch_id, channel.clone()).await;

        // Start generating AI response in a separate task
        self.generate_ai_response(branch_id, message, &user_node_id, &assistant_node_id)
            .await;

        // Fetch both nodes to return
        let user_node = self.chat_node_service.get_node(&user_node_id).await?;
        let assistant_node = self.chat_node_service.get_node(&assistant_node_id).await?;

        debug!(
            "Returning ChatMessagePair with user_node: {:?}, assistant_node: {:?}",
            user_node, assistant_node
        );
        // Return both nodes as a pair
        Ok(ChatMessagePair {
            user_node,
            assistant_node,
        })
    }

    /// Regenerate a response for an existing message
    pub async fn regenerate_message(
        &self,
        branch_id: &str,
        user_node_id: &str,
        message: &str,
        channel: Channel<MessageEvent>,
    ) -> sqlx::Result<()> {
        info!("Regenerating response for branch ID: {}", branch_id);
        debug!("User message content for regeneration: {}", message);
        debug!("User node ID: {}", user_node_id);
        debug!("Channel ID: {:?}", channel.id());

        // Prevent regeneration if an active stream exists for this branch
        if self.registry.get_stream(branch_id).await.is_some() {
            debug!(
                "Active stream exists for branch ID: {}, skipping regeneration",
                branch_id
            );
            return Ok(());
        }

        // Create a new version for the assistant node message and set as active
        let assistant_node_id = self
            .chat_node_service
            .create_node(
                branch_id,
                NodeType::AssistantMessage.as_str(),
                "", // Empty content initially
                Some(user_node_id),
            )
            .await?;

        info!(
            "Created new assistant node for regeneration with ID: {}",
            assistant_node_id
        );

        // Add stream to registry
        debug!("Adding stream to registry for branch ID: {}", branch_id);
        self.registry.add_stream(branch_id, channel.clone()).await;

        // Start generating AI response in a separate task
        self.generate_ai_response(branch_id, message, user_node_id, &assistant_node_id)
            .await;

        Ok(())
    }

    /// Reconnect to an existing chat stream with a new channel
    ///
    /// This function:
    /// 1. Checks if there's an active stream for the given branch ID
    /// 2. If there is, replaces the channel in the registry and returns success
    /// 3. If not, returns a message indicating no active stream
    pub async fn reconnect(
        &self,
        branch_id: &str,
        channel: Channel<MessageEvent>,
    ) -> ReconnectResponse {
        debug!("Attempting to reconnect for branch ID: {}", branch_id);
        debug!("New channel ID: {:?}", channel.id());

        // Check if there's an active stream for this specific branch ID
        if self.registry.get_stream(branch_id).await.is_some() {
            info!(
                "Active stream found for branch ID: {}, replacing it",
                branch_id
            );

            // Remove the existing stream for this branch ID only
            self.registry.remove_stream(branch_id).await;

            // Add the new stream for this branch ID only
            self.registry.add_stream(branch_id, channel).await;

            ReconnectResponse::Success
        } else {
            info!("No active stream found for branch ID: {}", branch_id);
            ReconnectResponse::NoActiveStream
        }
    }

    /// Unregister an active stream for a branch
    pub async fn unregister_stream(&self, branch_id: &str) {
        self.registry.remove_stream(branch_id).await;
    }

    /// Generate an AI response in a separate task
    async fn generate_ai_response(
        &self,
        branch_id: &str,
        message: &str,
        user_node_id: &str,
        assistant_node_id: &str,
    ) {
        debug!("Starting AI response generation for branch: {}", branch_id);
        debug!("Message prompt: {}", message);
        debug!("User node ID: {}", user_node_id);
        debug!("Assistant node ID: {}", assistant_node_id);

        let branch_id_clone = branch_id.to_string();
        let registry_clone = self.registry.clone();
        let message_clone = message.to_string();
        let chat_node_service_clone = self.chat_node_service.clone();
        let message_service_clone = self.message_service.clone();
        let ai_client_clone = self.ai_client.clone();
        let assistant_node_id_clone = assistant_node_id.to_string();

        tokio::spawn(async move {
            // Fetch message history for the branch
            info!("Fetching message history for branch: {}", branch_id_clone);

            // Prepare chat history using the new helper
            let chat_messages = Self::prepare_chat_history(
                &chat_node_service_clone,
                &branch_id_clone,
                &message_clone,
            )
            .await;

            // Log the prepared chat history for debugging
            let history_summary = chat_messages
                .iter()
                .enumerate()
                .map(|(i, msg)| {
                    format!("{}: {} (length: {} chars)", i, msg.role, msg.content.len())
                })
                .collect::<Vec<_>>()
                .join("\n");

            // Estimate total tokens (rough estimate is ~4 chars per token)
            let total_chars: usize = chat_messages.iter().map(|msg| msg.content.len()).sum();
            let estimated_tokens = total_chars / 4;

            debug!(
                "Prepared {} messages for chat history with approximately {} tokens:\n{}",
                chat_messages.len(),
                estimated_tokens,
                history_summary
            );

            // Flag to determine whether to send incremental HTML updates
            let send_incremental_updates = true;
            debug!("Incremental updates setting: {}", send_incremental_updates);

            debug!("Calling AI client to generate stream with chat history");
            match ai_client_clone.generate_chat_stream(chat_messages).await {
                Ok(mut stream) => {
                    debug!("Successfully created AI stream");
                    let mut full_response = String::new();
                    let mut chunk_count = 0;

                    while let Some(result) = stream.next().await {
                        match result {
                            Ok(json_str) => {
                                chunk_count += 1;
                                debug!("Received chunk #{}: {}", chunk_count, json_str);

                                if let Ok(json) =
                                    serde_json::from_str::<serde_json::Value>(&json_str)
                                {
                                    let response_text = json["text"].as_str().unwrap_or("");
                                    let is_done = json["done"].as_bool().unwrap_or(false);

                                    debug!(
                                        "Parsed JSON - text: '{}', done: {}",
                                        response_text, is_done
                                    );

                                    // Only send actual response text (not empty completion messages)
                                    if !response_text.is_empty() {
                                        // Add to full response before sending
                                        full_response.push_str(response_text);

                                        // Verify the stream still exists for this specific branch
                                        // This ensures we're not sending to a branch that has been disconnected
                                        // or that we're not sending to the wrong branch
                                        if let Some(channel) =
                                            registry_clone.get_stream(&branch_id_clone).await
                                        {
                                            // Convert the entire accumulated markdown to HTML for incremental updates
                                            let html_response = markdown_to_html(&full_response);

                                            // Send message to the branch-specific channel only
                                            if let Err(e) =
                                                channel.send(MessageEvent::MessageReceived {
                                                    message: html_response,
                                                    node_id: assistant_node_id_clone.clone(),
                                                    message_id: String::new(), // Empty for incremental updates
                                                })
                                            {
                                                error!(
                                                    "Failed to send message through channel: {:?}",
                                                    e
                                                );
                                                break;
                                            }
                                            debug!(
                                                "Sent incremental update to channel for branch: {}",
                                                branch_id_clone
                                            );

                                            // Store the message in history (original markdown)
                                            registry_clone
                                                .append_to_history(&branch_id_clone, response_text)
                                                .await;
                                            debug!(
                                                "Appended chunk to history for branch: {}",
                                                branch_id_clone
                                            );
                                        }
                                    }

                                    // If this is the last chunk, break the loop
                                    if is_done {
                                        info!(
                                            "Message generation completed after {} chunks",
                                            chunk_count
                                        );
                                        break;
                                    }
                                }
                            }
                            Err(e) => {
                                error!("Error processing response chunk: {:?}", e);
                                break;
                            }
                        }
                    }

                    // After completion, update the AI response in the database
                    if !full_response.is_empty() {
                        info!("Generated response: {}", full_response);
                        debug!("Final response length: {} characters", full_response.len());

                        // If assistant node ID is empty (regeneration case), let's skip updating
                        if !assistant_node_id_clone.is_empty() {
                            info!(
                                "Updating assistant node ID: {} with content",
                                assistant_node_id_clone
                            );

                            // Get the current node to find its active message ID
                            if let Ok(node) = chat_node_service_clone
                                .get_node(&assistant_node_id_clone)
                                .await
                            {
                                if let Some(active_message_id) = node.active_message_id {
                                    // Update the existing message content
                                    match message_service_clone
                                        .update(&active_message_id, &full_response)
                                        .await
                                    {
                                        Ok(_) => {
                                            info!("Successfully updated message content");

                                            // Update the message status to "done"
                                            if let Err(e) = message_service_clone
                                                .update_status(&active_message_id, "done")
                                                .await
                                            {
                                                error!("Failed to update message status: {:?}", e);
                                            } else {
                                                info!(
                                                    "Successfully updated message status to 'done'"
                                                );
                                            }

                                            // Verify the stream still exists before sending final update
                                            if let Some(channel) =
                                                registry_clone.get_stream(&branch_id_clone).await
                                            {
                                                // Get the final HTML content
                                                let html_response =
                                                    markdown_to_html(&full_response);
                                                debug!("Final HTML response generated for UI");

                                                // Send the final message with the content ID
                                                if let Err(e) =
                                                    channel.send(MessageEvent::MessageReceived {
                                                        message: html_response,
                                                        node_id: assistant_node_id_clone.clone(),
                                                        message_id: active_message_id.clone(),
                                                    })
                                                {
                                                    error!(
                                                        "Failed to send final message update: {:?}",
                                                        e
                                                    );
                                                }
                                                debug!("Sent final message update with content ID for branch: {}", branch_id_clone);

                                                // Send the completion event
                                                if let Err(e) =
                                                    channel.send(MessageEvent::GenerationComplete {
                                                        node_id: assistant_node_id_clone.clone(),
                                                    })
                                                {
                                                    error!(
                                                        "Failed to send completion event: {:?}",
                                                        e
                                                    );
                                                }
                                                debug!(
                                                    "Sent generation complete event for branch: {}",
                                                    branch_id_clone
                                                );
                                            }
                                        }
                                        Err(e) => {
                                            error!("Failed to update message content: {:?}", e);
                                        }
                                    }
                                } else {
                                    error!("Node has no active message ID");
                                }
                            } else {
                                error!("Failed to get node: {}", assistant_node_id_clone);
                            }
                        } else {
                            debug!(
                                "Assistant node ID is empty (regeneration case), skipping update"
                            );
                        }
                    } else {
                        debug!("No response was generated, not updating assistant node");
                    }

                    debug!(
                        "Removing stream from registry for branch: {}",
                        branch_id_clone
                    );
                    registry_clone.remove_stream(&branch_id_clone).await;
                }
                Err(e) => {
                    error!("Failed to send request to AI service: {:?}", e);
                    debug!("Error details: {:?}", e);
                    registry_clone.remove_stream(&branch_id_clone).await;
                }
            }
        });
    }

    /// Prepare chat history for AI generation
    async fn prepare_chat_history(
        chat_node_service: &ChatNodeService,
        branch_id: &str,
        message: &str,
    ) -> Vec<crate::services::ai_client::ChatMessage> {
        // Get all messages from the branch in chronological order (oldest first)
        // This will either return messages or panic on database errors
        let history_nodes = chat_node_service.get_branch_messages(branch_id).await;

        let mut chat_messages = Vec::new();
        for node in &history_nodes {
            let node_type: String = node.get("node_type");
            let content: String = node.get("content");
            let node_id: String = node.get("id");
            let token_count: Option<i64> = node.try_get("token_count").unwrap_or(None);

            let node_type = NodeType::from(node_type);

            // Skip nodes that don't have a role defined (notes)
            if let Some(role) = node_type.to_role() {
                chat_messages.push(crate::services::ai_client::ChatMessage {
                    role: role.to_string(),
                    content: content.clone(),
                });
            }
        }

        // Add the current user message if it's not already in history
        let current_msg = crate::services::ai_client::ChatMessage {
            role: "user".to_string(),
            content: message.to_string(),
        };
        if chat_messages.is_empty()
            || chat_messages.last().map_or(true, |last_msg| {
                !(last_msg.role == "user" && last_msg.content == message)
            })
        {
            chat_messages.push(current_msg);
        }
        chat_messages
    }
}
