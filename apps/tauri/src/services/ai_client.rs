use futures::{Stream, StreamExt};
use rig::completion::{CompletionRequest, Message as RigMessage};
use rig::providers::ollama;
use rig::streaming::{StreamingChat, StreamingChoice, StreamingPrompt};
use serde_json::Value;
use std::clone::Clone;
use std::error::Error;
use std::pin::Pin;

/// Configuration for AI model generation
#[derive(Clone, Debug)]
pub struct AIConfig {
    pub api_url: String,
    pub model: String,
    pub temperature: f64,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            api_url: "http://localhost:11434".to_string(),
            model: "gemma3:1b".to_string(),
            temperature: 0.5,
        }
    }
}

/// Message for chat completions
#[derive(Clone, Debug, serde::Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// AI client for text generation
pub struct AIClient {
    config: AIConfig,
}

impl AIClient {
    pub fn new(config: AIConfig) -> Self {
        Self { config }
    }

    /// Generate text from the AI model with a streaming response
    pub async fn generate_stream(
        &self,
        prompt: &str,
    ) -> Result<impl Stream<Item = Result<String, String>>, Box<dyn Error + Send + Sync>> {
        let messages = vec![ChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        }];

        self.generate_chat_stream(messages).await
    }

    /// Generate text using chat completions API with multiple messages
    pub async fn generate_chat_stream(
        &self,
        messages: Vec<ChatMessage>,
    ) -> Result<impl Stream<Item = Result<String, String>>, Box<dyn Error + Send + Sync>> {
        // Create ollama client
        let ollama_client = ollama::Client::new()
            .agent(&self.config.model)
            .temperature(self.config.temperature)
            // .additional_params(serde_json::json!({
            //     "format": {
            //             "type": "object",
            //             "properties": {
            //                 "title": {
            //                     "type": "string",
            //                     "maxLength": 256
            //                 }
            //         }
            //     }
            // }))
            .build();

        // Convert our ChatMessage format to rig Message format
        let rig_messages: Vec<RigMessage> = messages
            .iter()
            .map(|msg| {
                let role = msg.role.as_str();
                let content = msg.content.clone();

                // Revert to PascalCase tuple variants for the enum
                match role {
                    "user" => RigMessage::user(content),
                    "assistant" => RigMessage::assistant(content),
                    // Fallback or handle unknown roles appropriately
                    _ => RigMessage::user(content), // Defaulting to user
                }
            })
            .collect();

        let stream_result = ollama_client.stream_chat("", rig_messages).await;

        match stream_result {
            Ok(stream) => {
                // Convert rig's stream to our expected stream format
                let mapped_stream = stream.map(move |chunk| {
                    match chunk {
                        Ok(choice) => {
                            // Extract content from StreamingChoice
                            let content = choice.to_string();

                            // Create a custom response format for the stream
                            serde_json::to_string(&serde_json::json!({
                                "text": content,
                                "done": false
                            }))
                            .map_err(|e| e.to_string())
                        }
                        Err(e) => Err(e.to_string()),
                    }
                });

                // Add a final message with done=true
                let mapped_stream_with_done = mapped_stream.chain(futures::stream::once(async {
                    serde_json::to_string(&serde_json::json!({
                        "text": "",
                        "done": true
                    }))
                    .map_err(|e| e.to_string())
                }));

                Ok(Box::pin(mapped_stream_with_done)
                    as Pin<
                        Box<dyn Stream<Item = Result<String, String>> + Send>,
                    >)
            }
            Err(e) => {
                // Map the rig error to a boxed dyn Error
                Err(Box::new(e) as Box<dyn Error + Send + Sync>)
            }
        }
    }
}

// Allow cloning AIClient for use in async tasks
impl Clone for AIClient {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
        }
    }
}
