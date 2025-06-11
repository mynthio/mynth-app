use std::sync::Arc;
use std::time::Instant;

use anyhow::Error;

use dashmap::DashMap;
use futures::StreamExt;
use minijinja::Environment;
use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;
use tauri::ipc::Channel;
use tracing::debug;
use tracing::error;
use url::Url;

use crate::features::ai_client::{
    service::{AiClient, StreamRequest},
    stream_adapters::SseStreamAdapter,
};
use crate::features::event_sessions::core::EventSessionManager;
use crate::features::event_sessions::dtos::{ChatEventPayload, ChatEventSession};
use crate::features::node::dtos::NewNode;
use crate::features::node::dtos::NodeRole;
use crate::features::node::dtos::NodeType;
use crate::features::node::dtos::UpdateNode;
use crate::features::node_message::dtos::NewNodeMessage;
use crate::features::node_message::dtos::UpdateNodeMessage;
use crate::features::tools::repository::ToolsRepository;
use crate::utils::markdown::markdown_to_html;

use super::dtos::RegenerateNodePayload;
use super::response_mapper::{ResponseMapper, UnifiedResponse};

use crate::features::chat_stream_manager::dtos::ChatStreamEventPayload;
use crate::features::node::dtos::Node;
use crate::features::node::repository::NodeRepository;
use crate::features::provider_endpoint::dtos::ProviderEndpointCompatibility;
use crate::features::provider_endpoint::service::ProviderEndpointService;
use crate::features::workspace::dtos::WorkspaceItemContext;
use crate::features::workspace::dtos::WorkspaceItemContextInheritanceMode;
use crate::features::workspace::dtos::WorkspaceItemType;
use crate::features::{
    node::{
        dtos::{NewChatPair, NewChatPairAssistantNode, NewChatPairUserNode},
        service::NodeService,
    },
    node_message::repository::NodeMessageRepository,
    workspace::repository::WorkspaceRepository,
};

use crate::features::chat_stream_manager::service::ChatStreamManager;

use super::dtos::InitialCtx;
use super::repository::AiGenerationRepository;
use sqlx::SqlitePool;

pub struct AiGenerationService {
    ai_generation_repository: AiGenerationRepository,
    db_pool: Arc<SqlitePool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateContext {
    initial_ctx: InitialCtx,
    chat_history: Vec<Node>,
    system_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiMessage {
    role: String,
    content: String,
}

impl From<&Node> for OpenAiMessage {
    fn from(node: &Node) -> Self {
        Self {
            role: node.role.to_string(),
            content: node.message_content.clone().unwrap_or("".to_string()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiStreamOptions {
    include_usage: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiRequestBody {
    model: String,
    messages: Vec<OpenAiMessage>,
    stream: bool,
    stream_options: Option<OpenAiStreamOptions>,
    tools: Option<Vec<Value>>,
    tool_choice: String,
}

// Define the structure for the stream response chunk
#[derive(Debug, Serialize, Deserialize)]
struct ChatCompletionChunk {
    id: String,
    object: String,
    created: u64,
    model: String,
    choices: Vec<Choice>,
    #[serde(default)]
    system_fingerprint: Option<String>,
    #[serde(default)]
    usage: Option<OpenAiUsage>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Choice {
    index: u32,
    delta: Delta,
    finish_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Delta {
    #[serde(default)]
    content: Option<String>,
    #[serde(default)]
    role: Option<String>,
    #[serde(default)]
    tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ToolCall {
    id: String,
    index: u32,
    r#type: String,
    function: ToolCallFunction,
}

#[derive(Debug, Serialize, Deserialize)]
struct ToolCallFunction {
    name: String,
    arguments: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiUsage {
    prompt_tokens: u64,
    completion_tokens: u64,
    total_tokens: u64,
}

impl AiGenerationService {
    pub fn new(ai_generation_repository: AiGenerationRepository, db_pool: Arc<SqlitePool>) -> Self {
        Self {
            ai_generation_repository,
            db_pool,
        }
    }

    pub async fn generate(
        &self,
        pool: Arc<SqlitePool>,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
        workspace_repository: WorkspaceRepository,
        node_repository: NodeRepository,
        node_service: NodeService,
        node_message_repository: NodeMessageRepository,
        provider_endpoint_service: ProviderEndpointService,
        chat_stream_manager: Arc<ChatStreamManager>,
        branch_id: &str,
        message: &str,
        channel: Channel<ChatEventPayload>,
    ) -> Result<(), Error> {
        debug!(
            branch_id = branch_id,
            message = message,
            "AIGenerationService::generate"
        );
        let start = Instant::now();

        EventSessionManager::create(event_sessions, branch_id.to_string(), channel);

        // TODO: Get data
        // - Branch
        // - Chat
        // - Model
        // - Provider
        // - Endpoint
        let initial_ctx = self
            .ai_generation_repository
            .get_initial_ctx(branch_id)
            .await?;

        // TODO: Verify data
        // initial_ctx.validate().inspect_err(|e| {
        //     error!(
        //         "AIGenerationService::generate::initial_ctx::validate: {}",
        //         e
        //     )
        // })?;

        // TODO: Insert `user` message into db
        // TODO: Insert `assistant` node with placeholder message into db
        let chat_pair = NewChatPair {
            user_node: NewChatPairUserNode {
                content: message.to_string(),
            },
            assistant_node: NewChatPairAssistantNode {
                content: "".to_string(),
                model_id: initial_ctx.model_id.clone(),
            },
        };

        let (user_node_id, assistant_node_id, user_node_message_id, assistant_node_message_id) =
            node_service
                .create_chat_pair(
                    pool.clone(),
                    node_message_repository,
                    initial_ctx.branch_id.clone(),
                    chat_pair,
                )
                .await
                .inspect_err(|e| {
                    error!("AIGenerationService::generate::create_chat_pair: {}", e)
                })?;

        let workspace_item_context = self
            .get_workspace_item_context(&initial_ctx, &workspace_repository)
            .await?;

        debug!(
            workspace_item_context = ?workspace_item_context,
            "AIGenerationService::generate::workspace_item_context"
        );

        // TODO: Get chat history
        // - Fetch from DB
        let chat_history = node_repository
            .get_all_by_branch_id_and_after_node_id(branch_id, &assistant_node_id)
            .await?;

        debug!(
            chat_history = ?chat_history,
            "AIGenerationService::generate::chat_history"
        );

        // TODO: At this place, if provider is OpenAI compatible, we can use the OpenAI API to generate the response
        if initial_ctx.endpoint_compatibility == ProviderEndpointCompatibility::OpenAI {
            let initial_ctx = initial_ctx.clone();
            let message_id = assistant_node_message_id.clone();
            let chat_history = chat_history.clone();
            let workspace_item_context = workspace_item_context.clone();
            let event_sessions = event_sessions.clone(); // Clone the Arc to move into spawn
            let self_clone = Arc::new(AiGenerationService {
                ai_generation_repository: AiGenerationRepository::new(self.db_pool.clone()),
                db_pool: self.db_pool.clone(),
            });
            let _ = tokio::spawn(async move {
                self_clone
                    .open_ai_chat_stream(
                        initial_ctx,
                        message_id,
                        chat_history,
                        workspace_item_context.context,
                        event_sessions,
                    )
                    .await
            });

            return Ok(());
        }

        // TODO: Convert history to model/provider compatible chat history
        let mut env = Environment::new();
        let schema = initial_ctx.endpoint_request_template.as_ref().unwrap();
        env.add_template("template", schema).unwrap();
        let template = env.get_template("template").unwrap();

        let context = TemplateContext {
            initial_ctx: initial_ctx.clone(),
            chat_history,
            system_prompt: workspace_item_context.context,
        };

        let rendered = template
            .render(&context)
            .inspect_err(|e| error!("AIGenerationService::generate::template::render: {}", e))
            .unwrap();

        // TODO: Build the request for provider, endpoint and model

        // TODO: Send a request
        // - Handle streaming response
        // - Parse response, based on data
        let mut bytes_stream = provider_endpoint_service
            .stream(initial_ctx.endpoint_id.as_ref(), rendered)
            .await?;

        while let Some(Ok(bytes)) = bytes_stream.next().await {
            let json: Value = match serde_json::from_slice(&bytes) {
                Ok(json) => json,
                Err(e) => {
                    eprintln!("Failed to parse JSON: {}", e);
                    continue;
                }
            };

            debug!(json = ?json, "AIGenerationService::generate::json");
        }

        // TODO: Return inserted messages
        // - With formatting
        // - with new IDs

        let duration = start.elapsed();
        debug!("AiGenerationService::generate::duration {:?}", duration);

        Ok(())
    }

    async fn get_workspace_item_context(
        &self,
        initial_ctx: &InitialCtx,
        workspace_repository: &WorkspaceRepository,
    ) -> Result<WorkspaceItemContext, Error> {
        if initial_ctx.chat_context_inheritance_mode == WorkspaceItemContextInheritanceMode::None {
            Ok(WorkspaceItemContext {
                item_type: WorkspaceItemType::Chat,
                item_id: initial_ctx.chat_id.clone(),
                context: initial_ctx.chat_context.clone(),
            })
        } else {
            // Fetch context based on inheritance mode
            workspace_repository
                .get_item_context(&initial_ctx.chat_id)
                .await
                .inspect_err(|e| error!("AIGenerationService::get_workspace_item_context: {}", e))
                .map_err(Error::from)
        }
    }

    async fn open_ai_chat_stream(
        &self,
        initial_ctx: InitialCtx,
        message_id: String,
        chat_history: Vec<Node>,
        system_prompt: Option<String>,
        event_sessions: Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), Error> {
        debug!(
            initial_ctx = ?initial_ctx,
            chat_history = ?chat_history,
            system_prompt = ?system_prompt,
            "AIGenerationService::open_ai_chat_stream"
        );

        let url = Url::parse(&initial_ctx.provider_base_url)?
            .join(&initial_ctx.endpoint_path)?
            .to_string();

        debug!(url = ?url, "AIGenerationService::open_ai_chat_stream::url");
        /*
         * Map the chat history to the OpenAI chat history format and create JSON request body with model name
         *
         * "model": "llama2",
         * "messages": [
         *  {
         *      "role": "system",
         *      "content": "You are a helpful assistant."
         *  },
         *  {
         *      "role": "user",
         *      "content": "Hello!"
         *  }
         * ]
         *
         */
        let mut messages =
            Vec::with_capacity(chat_history.len() + if system_prompt.is_some() { 1 } else { 0 });
        if let Some(system_prompt) = system_prompt {
            messages.push(OpenAiMessage {
                role: "system".to_string(),
                content: system_prompt,
            });
        }

        messages.extend(chat_history.iter().map(Into::into));

        let tools_repository = ToolsRepository::new(self.db_pool.clone());
        let active_tools = tools_repository
            .find_all_active_by_chat_id(&initial_ctx.chat_id)
            .await?;
        debug!(active_tools = ?active_tools, "AIGenerationService::open_ai_chat_stream::active_tools");

        // Parse tools and handle errors properly 🔧
        let tools: Vec<Value> = active_tools
            .iter()
            .filter_map(|tool| {
                tool.input_schema.as_ref().and_then(|schema| {
                    match serde_json::from_str::<Value>(schema) {
                        Ok(mut parsed_tool) => {
                            // Modify the function name to include MCP server prefix
                            if let Some(function) = parsed_tool.get_mut("function") {
                                if let Some(function_obj) = function.as_object_mut() {
                                    if let Some(name) = function_obj.get("name") {
                                        if let Some(name_str) = name.as_str() {
                                            // Create prefixed name: mcp_server_name + "_" + tool.name
                                            let prefixed_name = format!("{}", tool.name.clone(),);
                                            function_obj.insert(
                                                "name".to_string(),
                                                Value::String(prefixed_name),
                                            );
                                        }
                                    }
                                }
                            }

                            debug!(
                                tool_name = %tool.name,
                                parsed_tool = ?parsed_tool,
                                "Successfully parsed and modified tool schema"
                            );
                            Some(parsed_tool)
                        }
                        Err(e) => {
                            error!(
                                tool_name = %tool.name,
                                schema = %schema,
                                error = %e,
                                "Failed to parse tool input schema"
                            );
                            None
                        }
                    }
                })
            })
            .collect();

        debug!(
            tools_count = tools.len(),
            tools = ?tools,
            "Parsed tools for OpenAI request"
        );

        let request_body = OpenAiRequestBody {
            model: initial_ctx.model_name.clone(),
            messages,
            stream: true,
            stream_options: Some(OpenAiStreamOptions {
                include_usage: Some(true),
            }),
            tools: if tools.is_empty() { None } else { Some(tools) },
            tool_choice: "auto".to_string(),
        };

        debug!(
            request_body = ?request_body,
            request_body_json = ?serde_json::to_value(&request_body)?,
            "AIGenerationService::open_ai_chat_stream::request_body"
        );

        // Create the stream request for the AI client
        let stream_request = StreamRequest {
            url,
            headers: [("Content-Type".to_string(), "application/json".to_string())]
                .into_iter()
                .collect(),
            body: serde_json::to_value(&request_body)?,
        };

        // Use the AI client with SSE adapter to get raw JSON strings
        let ai_client = AiClient::new();
        let mut json_stream = ai_client
            .stream_request_with_adapter(stream_request, SseStreamAdapter::default())
            .await?;

        // Create a response mapper for OpenAI format
        let response_mapper = ResponseMapper::openai();
        let mut full_text = String::new();

        // Process each JSON string from the stream
        while let Some(json_result) = json_stream.next().await {
            if let Err(e) = self
                .process_stream_result(
                    json_result,
                    &response_mapper,
                    &mut full_text,
                    &initial_ctx,
                    &message_id,
                    &event_sessions,
                )
                .await
            {
                error!(error = %e, "Failed to process stream result");
                break;
            }
        }

        debug!(full_text = ?full_text, "AIGenerationService::open_ai_chat_stream::full_text");

        // Send the "Done" event to indicate stream completion
        self.send_done_event(&initial_ctx, &event_sessions)?;

        EventSessionManager::delete(&event_sessions, &initial_ctx.branch_id);

        Ok(())
    }

    /// Process a single result from the JSON stream
    async fn process_stream_result(
        &self,
        json_result: Result<String, std::io::Error>,
        response_mapper: &ResponseMapper,
        full_text: &mut String,
        initial_ctx: &InitialCtx,
        message_id: &str,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), anyhow::Error> {
        let json_str = json_result.map_err(|e| anyhow::Error::new(e))?;
        debug!(json_str = %json_str, "Received JSON from stream");

        let response = response_mapper.parse(&json_str).map_err(|e| {
            error!(error = %e, json_str = %json_str, "Failed to parse response");
            e
        })?;

        self.handle_unified_response(response, full_text, initial_ctx, message_id, event_sessions)
            .await
    }

    /// Handle different types of unified responses
    async fn handle_unified_response(
        &self,
        response: UnifiedResponse,
        full_text: &mut String,
        initial_ctx: &InitialCtx,
        message_id: &str,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), anyhow::Error> {
        match response {
            UnifiedResponse::Streaming {
                content,
                finish_reason,
            } => {
                self.handle_streaming_response(
                    content,
                    finish_reason,
                    full_text,
                    initial_ctx,
                    message_id,
                    event_sessions,
                )
                .await
            }
            UnifiedResponse::Final {
                content,
                finish_reason,
            } => {
                self.handle_final_response(content, finish_reason, full_text, message_id)
                    .await
            }
            UnifiedResponse::ToolCall {
                tool_calls,
                finish_reason,
            } => {
                self.handle_tool_call_response(
                    tool_calls,
                    finish_reason,
                    initial_ctx,
                    message_id,
                    event_sessions,
                )
                .await
            }
            UnifiedResponse::Usage { usage } => {
                self.handle_usage_response(usage, initial_ctx, event_sessions)
                    .await
            }
            UnifiedResponse::Error { message } => {
                error!(error_message = %message, "Received error response");
                Err(anyhow::Error::msg(format!("Stream error: {}", message)))
            }
        }
    }

    /// Handle streaming response chunks
    async fn handle_streaming_response(
        &self,
        content: String,
        finish_reason: Option<String>,
        full_text: &mut String,
        initial_ctx: &InitialCtx,
        message_id: &str,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), anyhow::Error> {
        if !content.is_empty() {
            debug!(content = %content, "Received streaming content");
            full_text.push_str(&content);

            if let Err(e) = EventSessionManager::send_event(
                event_sessions,
                &initial_ctx.branch_id,
                ChatEventPayload::Chunk {
                    chat_id: initial_ctx.chat_id.clone(),
                    branch_id: initial_ctx.branch_id.clone(),
                    message_id: message_id.to_string(),
                    message_content: markdown_to_html(&full_text.to_string()),
                    delta: content,
                },
            ) {
                error!(error = %e, "Failed to send stream update via event session");
            }
        }

        if let Some(reason) = finish_reason {
            debug!(finish_reason = %reason, "Received finish reason in streaming");
        }

        Ok(())
    }

    /// Handle tool call response - when the model wants to use a tool
    async fn handle_tool_call_response(
        &self,
        tool_calls: Vec<super::response_mapper::ToolCallInfo>,
        finish_reason: Option<String>,
        initial_ctx: &InitialCtx,
        message_id: &str,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), anyhow::Error> {
        debug!(
            tool_calls = ?tool_calls,
            finish_reason = ?finish_reason,
            "Received tool call request from model"
        );

        // TODO: Implement actual tool call logic here 🔧
        // For now, just log the tool calls and send an event
        for tool_call in &tool_calls {
            debug!(
                tool_id = %tool_call.id,
                function_name = %tool_call.function_name,
                function_arguments = %tool_call.function_arguments,
                "Tool call detected - placeholder implementation"
            );

            let tool_repository = ToolsRepository::new(self.db_pool.clone());
            let tool = tool_repository
                .find_by_name(&tool_call.function_name)
                .await?;
            debug!(tool = ?tool, "Tool call detected - placeholder implementation");

            if let Some(tool) = tool {
                let node_repository = NodeRepository::new(self.db_pool.clone());
                // node_repository
                //     .create(NewNode {
                //         id: None,
                //         r#type: NodeType::ToolUse,
                //         role: NodeRole::Assistant,
                //         branch_id: initial_ctx.branch_id.to_string(),
                //         active_tool_use_id: Some(tool_call.id.clone()),
                //     })
                //     .await?;
            }

            // TODO: Future implementation will include:
            // 1. Validate tool call against available tools
            // 2. Execute the tool with the provided arguments
            // 3. Capture tool execution results
            // 4. Send results back to the model for continuation
            // 5. Handle tool errors gracefully
        }

        // For now, send an event to the UI about the tool call (placeholder)
        if let Err(e) = EventSessionManager::send_event(
            event_sessions,
            &initial_ctx.branch_id,
            ChatEventPayload::Chunk {
                chat_id: initial_ctx.chat_id.clone(),
                branch_id: initial_ctx.branch_id.clone(),
                message_id: message_id.to_string(),
                message_content: format!(
                    "<p><strong>🔧 Tool Call Detected:</strong> {} (placeholder)</p>",
                    tool_calls
                        .iter()
                        .map(|tc| tc.function_name.clone())
                        .collect::<Vec<_>>()
                        .join(", ")
                ),
                delta: String::new(),
            },
        ) {
            error!(error = %e, "Failed to send tool call event via event session");
        }

        if let Some(reason) = finish_reason {
            debug!(finish_reason = %reason, "Received finish reason with tool call");
        }

        Ok(())
    }

    /// Handle usage response - send usage information to UI
    async fn handle_usage_response(
        &self,
        usage: super::response_mapper::UsageInfo,
        initial_ctx: &InitialCtx,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), anyhow::Error> {
        debug!(usage = ?usage, "Received usage information");

        // Convert response_mapper::UsageInfo to ai_client::dtos::UsageInfo
        let usage_info = crate::features::ai_client::dtos::UsageInfo {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            provider_specific: None,
        };

        if let Err(e) = EventSessionManager::send_event(
            event_sessions,
            &initial_ctx.branch_id,
            ChatEventPayload::Usage {
                chat_id: initial_ctx.chat_id.clone(),
                branch_id: initial_ctx.branch_id.clone(),
                usage_data: usage_info,
            },
        ) {
            error!(error = %e, "Failed to send usage update via event session");
        }

        Ok(())
    }

    /// Handle final response
    async fn handle_final_response(
        &self,
        content: Option<String>,
        finish_reason: String,
        full_text: &mut String,
        message_id: &str,
    ) -> Result<(), anyhow::Error> {
        debug!(
            finish_reason = %finish_reason,
            has_content = %content.is_some(),
            "Received final response"
        );

        // Handle any final content
        if let Some(final_content) = content {
            if !final_content.is_empty() {
                full_text.push_str(&final_content);
            }
        }

        let node_message_repository = NodeMessageRepository::new(self.db_pool.clone());

        let _ = node_message_repository
            .update(UpdateNodeMessage {
                content: Some(full_text.to_string()),
                status: None,
                id: message_id.to_string(),
            })
            .await?;

        debug!("Stream completed with reason: {}", finish_reason);
        Ok(())
    }

    /// Send "Done" event to indicate stream completion
    fn send_done_event(
        &self,
        initial_ctx: &InitialCtx,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), anyhow::Error> {
        if let Err(e) = EventSessionManager::send_event(
            event_sessions,
            &initial_ctx.branch_id,
            ChatEventPayload::Done {
                chat_id: initial_ctx.chat_id.clone(),
                branch_id: initial_ctx.branch_id.clone(),
            },
        ) {
            error!(error = %e, "Failed to send done event via event session");
        }
        Ok(())
    }

    pub async fn regenerate_node(
        &self,
        channel: Channel<ChatEventPayload>,
        payload: RegenerateNodePayload,
        event_sessions: &Arc<DashMap<String, ChatEventSession>>,
    ) -> Result<(), Error> {
        debug!(payload = ?payload, "AIGenerationService::regenerate_node");

        let node_repository = NodeRepository::new(self.db_pool.clone());
        let node_to_regenerate = node_repository.get(&payload.id).await?;

        debug!(node_to_regenerate = ?node_to_regenerate, "AIGenerationService::regenerate_node::node_to_regenerate");

        let initial_ctx = self
            .ai_generation_repository
            .get_initial_ctx(&node_to_regenerate.branch_id)
            .await?;

        EventSessionManager::create(
            event_sessions,
            node_to_regenerate.branch_id.to_string(),
            channel,
        );

        let new_message_version = node_to_regenerate.message_version_count.unwrap_or(0);

        let mut tx = self.db_pool.begin().await?;

        let new_message = NewNodeMessage {
            id: None,
            status: "".to_string(),
            node_id: node_to_regenerate.id.clone(),
            content: "".to_string(),
            model_id: payload
                .overwrite_model_id
                .or(Some(initial_ctx.model_id.clone())),
            version_number: new_message_version,
        };
        let node_message_repository = NodeMessageRepository::new(self.db_pool.clone());
        let new_message_id = node_message_repository
            .create_with_executor(&mut *tx, new_message)
            .await?;

        node_repository
            .update_with_executor(
                &mut *tx,
                UpdateNode {
                    id: node_to_regenerate.id.clone(),
                    active_message_id: Some(new_message_id.clone()),
                    ..Default::default()
                },
            )
            .await?;
        tx.commit().await?;

        let workspace_repository = WorkspaceRepository::new(self.db_pool.clone());

        let workspace_item_context = self
            .get_workspace_item_context(&initial_ctx, &workspace_repository)
            .await?;

        let chat_history = node_repository
            .get_all_by_branch_id_and_after_node_id(&initial_ctx.branch_id, &node_to_regenerate.id)
            .await?;

        // TODO: At this place, if provider is OpenAI compatible, we can use the OpenAI API to generate the response
        if initial_ctx.endpoint_compatibility == ProviderEndpointCompatibility::OpenAI {
            let initial_ctx = initial_ctx.clone();
            let message_id = new_message_id.clone();
            let chat_history = chat_history.clone();
            let workspace_item_context = workspace_item_context.clone();
            let event_sessions = event_sessions.clone(); // Clone the Arc to move into spawn
            let self_clone = Arc::new(AiGenerationService {
                ai_generation_repository: AiGenerationRepository::new(self.db_pool.clone()),
                db_pool: self.db_pool.clone(),
            });
            let _ = tokio::spawn(async move {
                self_clone
                    .open_ai_chat_stream(
                        initial_ctx,
                        message_id,
                        chat_history,
                        workspace_item_context.context,
                        event_sessions,
                    )
                    .await
            });

            return Ok(());
        }

        // TODO: Convert history to model/provider compatible chat history

        Ok(())
    }
}
