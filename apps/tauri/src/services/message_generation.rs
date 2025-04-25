use futures::StreamExt;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::sync::Arc;
use tauri::ipc::Channel;
use tracing::{debug, error, info};

use crate::models::chat::ChatMessagePair;
use crate::models::node_type::NodeType;
use crate::services::ai_client::{AIClient, AIConfig};
use crate::services::chat_node::{ChatNodeService, GetAllChatNodesParams, UpdateChatNodeParams};
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
        node_id: &str,
        channel: Channel<MessageEvent>,
    ) -> sqlx::Result<()> {
        info!("Regenerating response for node ID: {}", node_id);

        let chat_node = self.chat_node_service.get_node(node_id).await?;
        let branch_id = chat_node.branch_id.clone();

        // Prevent regeneration if an active stream exists for this branch
        if self.registry.get_stream(&branch_id).await.is_some() {
            debug!(
                "Active stream exists for branch ID: {}, skipping regeneration",
                branch_id
            );

            return Ok(());
        }

        let mut tx = self.pool.get().begin().await?;

        let next_version_number = self
            .message_service
            .get_next_version_number_with_executor(&mut *tx, &chat_node.id)
            .await?;

        // Create a new version for the assistant node message and set as active
        let new_message = self
            .message_service
            .create_with_executor(
                &mut *tx,
                &chat_node.id,
                "",
                next_version_number,
                "generating",
            )
            .await?;

        // Clone before potential move
        let new_message_clone = new_message.clone();

        self.chat_node_service
            .update_with_executor(
                &mut *tx,
                node_id,
                UpdateChatNodeParams {
                    active_message_id: Some(new_message),
                    ..Default::default()
                },
            )
            .await?;

        tx.commit().await?;

        // Add stream to registry
        debug!("Adding stream to registry for branch ID: {}", branch_id);
        self.registry.add_stream(&branch_id, channel.clone()).await;

        // Clone necessary services and values before spawning task
        let chat_node_service = self.chat_node_service.clone();
        let ai_client = self.ai_client.clone();
        let node_id_clone = chat_node.id.clone();
        let new_message_clone = new_message_clone;
        let stream_registry_clone = self.registry.clone();
        let message_service_clone = self.message_service.clone();

        tokio::spawn(async move {
            let nodes = chat_node_service
                .get_all(GetAllChatNodesParams {
                    older_than: Some(node_id_clone.clone()),
                    branch_id: Some(branch_id.clone()),
                })
                .await
                .unwrap();

            let mut chat_history = vec![];

            for node in &nodes {
                let node_type: String = node.node_type.clone();
                let content: String = node.active_message.as_ref().unwrap().content.clone();
                let node_type = NodeType::from(node_type);

                // Skip nodes that don't have a role defined (notes)
                if let Some(role) = node_type.to_role() {
                    chat_history.push(crate::services::ai_client::ChatMessage {
                        role: role.to_string(),
                        content: content,
                    });
                }
            }

            let last_user_message = chat_history.pop().unwrap();

            let mut stream = ai_client
                .generate_chat_stream(&last_user_message.content, chat_history)
                .await
                .unwrap();

            let mut full_response = String::new();

            while let Some(result) = stream.next().await {
                let json = serde_json::from_str::<serde_json::Value>(&result.unwrap()).unwrap();
                let response_text = json["text"].as_str().unwrap_or("");
                full_response.push_str(response_text);

                if let Some(stream_channel) = stream_registry_clone.get_stream(&branch_id).await {
                    let html_response = markdown_to_html(&full_response);

                    // Send message to the branch-specific channel only
                    stream_channel.send(MessageEvent::MessageReceived {
                        message: html_response,
                        node_id: node_id_clone.clone(),
                        message_id: new_message_clone.clone(),
                    });
                }
            }

            stream_registry_clone.remove_stream(&branch_id).await;

            debug!("Full response: {}", full_response);

            // Update the message content and status to "done"
            message_service_clone
                .update(&new_message_clone, &full_response)
                .await;
        });

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
        let user_node_id_clone = user_node_id.to_string();
        tokio::spawn(async move {
            // Prepare chat history using the new helper
            let nodes = chat_node_service_clone
                .get_all(GetAllChatNodesParams {
                    older_than: Some(user_node_id_clone.clone()),
                    branch_id: Some(branch_id_clone.clone()),
                })
                .await
                .unwrap();

            let mut chat_history = vec![];

            for node in &nodes {
                let node_type: String = node.node_type.clone();
                let content: String = node.active_message.as_ref().unwrap().content.clone();
                let node_type = NodeType::from(node_type);

                // Skip nodes that don't have a role defined (notes)
                if let Some(role) = node_type.to_role() {
                    chat_history.push(crate::services::ai_client::ChatMessage {
                        role: role.to_string(),
                        content: content,
                    });
                }
            }

            match ai_client_clone
                .generate_chat_stream(&message_clone, chat_history)
                .await
            {
                Ok(mut stream) => {
                    let mut full_response = String::new();
                    let mut chunk_count = 0;

                    while let Some(result) = stream.next().await {
                        match result {
                            Ok(json_str) => {
                                chunk_count += 1;

                                if let Ok(json) =
                                    serde_json::from_str::<serde_json::Value>(&json_str)
                                {
                                    let response_text = json["text"].as_str().unwrap_or("");
                                    let is_done = json["done"].as_bool().unwrap_or(false);

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

                                            // Store the message in history (original markdown)
                                            registry_clone
                                                .append_to_history(&branch_id_clone, response_text)
                                                .await;
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

        chat_messages
    }
}
