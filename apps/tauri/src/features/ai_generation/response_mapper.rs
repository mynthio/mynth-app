use anyhow::{Error, Result};
use serde_json::Value;
use tracing::debug;

/// Unified response types that any provider response gets mapped to.
/// This allows the AI generation service to use simple match statements.
#[derive(Debug, Clone)]
pub enum UnifiedResponse {
    /// Normal streaming response with content (most common)
    Streaming {
        content: String,
        finish_reason: Option<String>,
    },
    /// Final response, may include usage information
    Final {
        content: Option<String>,
        finish_reason: String,
    },
    /// Tool call response - when the model wants to use a tool
    ToolCall {
        tool_calls: Vec<ToolCallInfo>,
        finish_reason: Option<String>,
    },
    Usage {
        usage: UsageInfo,
    },
    /// Error response (placeholder for future use)
    Error {
        message: String,
    },
}

#[derive(Debug, Clone)]
pub struct UsageInfo {
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub total_tokens: Option<u32>,
}

#[derive(Debug, Clone)]
pub struct ToolCallInfo {
    pub id: String,
    pub index: u32,
    pub call_type: String,
    pub function_name: String,
    pub function_arguments: String,
}

/// Simple mapper configuration that tells us where to find fields in provider JSON.
/// For popular providers (OpenAI, Anthropic), we use hardcoded parsing for performance.
/// For custom providers, we use simple path-based extraction.
#[derive(Debug, Clone)]
pub struct ResponseMapper {
    pub provider_type: ProviderType,
}

#[derive(Debug, Clone)]
pub enum ProviderType {
    /// OpenAI-compatible API (hardcoded for performance)
    OpenAI,
    // Anthropic Claude API (hardcoded for performance)
    // Anthropic,
    // /// Custom provider with simple field paths
    // Custom {
    //     content_path: Vec<String>,
    //     finish_reason_path: Vec<String>,
    //     usage_prompt_tokens_path: Vec<String>,
    //     usage_completion_tokens_path: Vec<String>,
    //     usage_total_tokens_path: Option<Vec<String>>,
    // },
}

impl ResponseMapper {
    /// Create mapper for OpenAI-compatible providers
    pub fn openai() -> Self {
        Self {
            provider_type: ProviderType::OpenAI,
        }
    }

    /// Create mapper for Anthropic Claude
    // pub fn anthropic() -> Self {
    //     Self {
    //         provider_type: ProviderType::Anthropic,
    //     }
    // }

    /// Parse JSON string and return unified response
    pub fn parse(&self, json_str: &str) -> Result<UnifiedResponse> {
        let json: Value = serde_json::from_str(json_str)?;

        debug!(json_str = json_str, provider_type = ?self.provider_type, "Parsing response");

        match &self.provider_type {
            ProviderType::OpenAI => self.parse_openai(&json),
            // ProviderType::Anthropic => self.parse_anthropic(&json),
            // ProviderType::Custom { .. } => self.parse_custom(&json),
        }
    }

    /// Hardcoded OpenAI parsing for performance
    fn parse_openai(&self, json: &Value) -> Result<UnifiedResponse> {
        // Extract content from choices[0].delta.content
        let content = json
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("delta"))
            .and_then(|delta| delta.get("content"))
            .and_then(|content| content.as_str())
            .map(|s| s.to_string());

        // Extract finish_reason from choices[0].finish_reason
        let finish_reason = json
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("finish_reason"))
            .and_then(|reason| reason.as_str())
            .map(|s| s.to_string());

        // Extract tool calls from choices[0].delta.tool_calls
        let tool_calls = json
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("delta"))
            .and_then(|delta| delta.get("tool_calls"))
            .and_then(|tool_calls| tool_calls.as_array())
            .map(|tools| {
                tools
                    .iter()
                    .filter_map(|tool| {
                        let id = tool.get("id")?.as_str()?.to_string();
                        let index = tool.get("index")?.as_u64()? as u32;
                        let call_type = tool.get("type")?.as_str()?.to_string();
                        let function = tool.get("function")?;
                        let function_name = function.get("name")?.as_str()?.to_string();
                        let function_arguments = function.get("arguments")?.as_str()?.to_string();

                        Some(ToolCallInfo {
                            id,
                            index,
                            call_type,
                            function_name,
                            function_arguments,
                        })
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        // Extract usage information
        let usage = json.get("usage").and_then(|usage_obj| {
            let prompt_tokens = usage_obj.get("prompt_tokens")?.as_u64().map(|v| v as u32);
            let completion_tokens = usage_obj
                .get("completion_tokens")?
                .as_u64()
                .map(|v| v as u32);
            let total_tokens = usage_obj.get("total_tokens")?.as_u64().map(|v| v as u32);

            Some(UsageInfo {
                prompt_tokens,
                completion_tokens,
                total_tokens,
            })
        });

        // Determine response type - prioritize tool calls over content
        if !tool_calls.is_empty() {
            // Tool call response
            Ok(UnifiedResponse::ToolCall {
                tool_calls,
                finish_reason,
            })
        } else if let Some(reason) = finish_reason {
            // Final response
            Ok(UnifiedResponse::Final {
                content,
                finish_reason: reason,
            })
        } else if let Some(content_text) = content {
            // Streaming response
            Ok(UnifiedResponse::Streaming {
                content: content_text,
                finish_reason: None,
            })
        } else if let Some(usage) = usage {
            Ok(UnifiedResponse::Usage { usage })
        } else {
            // No content and no finish reason - might be an error or empty chunk
            Ok(UnifiedResponse::Streaming {
                content: String::new(),
                finish_reason: None,
            })
        }
    }

    // Hardcoded Anthropic parsing for performance
    // fn parse_anthropic(&self, json: &Value) -> Result<UnifiedResponse> {
    //     let message_type = json.get("type").and_then(|t| t.as_str());

    //     match message_type {
    //         Some("content_block_delta") => {
    //             // Streaming content
    //             let content = json
    //                 .get("delta")
    //                 .and_then(|delta| delta.get("text"))
    //                 .and_then(|text| text.as_str())
    //                 .unwrap_or("")
    //                 .to_string();

    //             Ok(UnifiedResponse::Streaming {
    //                 content,
    //                 finish_reason: None,
    //             })
    //         }
    //         Some("message_stop") => {
    //             // Final message
    //             let usage = json.get("usage").and_then(|usage_obj| {
    //                 let prompt_tokens = usage_obj.get("input_tokens")?.as_u64().map(|v| v as u32);
    //                 let completion_tokens =
    //                     usage_obj.get("output_tokens")?.as_u64().map(|v| v as u32);
    //                 let total_tokens = match (prompt_tokens, completion_tokens) {
    //                     (Some(p), Some(c)) => Some(p + c),
    //                     _ => None,
    //                 };

    //                 Some(UsageInfo {
    //                     prompt_tokens,
    //                     completion_tokens,
    //                     total_tokens,
    //                 })
    //             });

    //             Ok(UnifiedResponse::Final {
    //                 content: None,
    //                 finish_reason: "stop".to_string(),
    //             })
    //         }
    //         _ => {
    //             // Unknown type, treat as empty streaming
    //             Ok(UnifiedResponse::Streaming {
    //                 content: String::new(),
    //                 finish_reason: None,
    //             })
    //         }
    //     }
    // }

    // Simple path-based parsing for custom providers
    // fn parse_custom(&self, json: &Value) -> Result<UnifiedResponse> {
    //     if let ProviderType::Custom {
    //         content_path,
    //         finish_reason_path,
    //         usage_prompt_tokens_path,
    //         usage_completion_tokens_path,
    //         usage_total_tokens_path,
    //     } = &self.provider_type
    //     {
    //         // Extract content
    //         // let content = self
    //         //     .extract_value_by_path(json, content_path)
    //         //     .and_then(|v| v.as_str())
    //         //     .map(|s| s.to_string());

    //         // // Extract finish reason
    //         // let finish_reason = self
    //         //     .extract_value_by_path(json, finish_reason_path)
    //         //     .and_then(|v| v.as_str())
    //         //     .map(|s| s.to_string());

    //         // // Extract usage
    //         // let usage = {
    //         //     let prompt_tokens = self
    //         //         .extract_value_by_path(json, usage_prompt_tokens_path)
    //         //         .and_then(|v| v.as_u64())
    //         //         .map(|v| v as u32);

    //         //     let completion_tokens = self
    //         //         .extract_value_by_path(json, usage_completion_tokens_path)
    //         //         .and_then(|v| v.as_u64())
    //         //         .map(|v| v as u32);

    //         //     let total_tokens = if let Some(total_path) = usage_total_tokens_path {
    //         //         self.extract_value_by_path(json, total_path)
    //         //             .and_then(|v| v.as_u64())
    //         //             .map(|v| v as u32)
    //         //     } else {
    //         //         match (prompt_tokens, completion_tokens) {
    //         //             (Some(p), Some(c)) => Some(p + c),
    //         //             _ => None,
    //         //         }
    //         //     };

    //         //     if prompt_tokens.is_some() || completion_tokens.is_some() || total_tokens.is_some()
    //         //     {
    //         //         Some(UsageInfo {
    //         //             prompt_tokens,
    //         //             completion_tokens,
    //         //             total_tokens,
    //         //         })
    //         //     } else {
    //         //         None
    //         //     }
    //         // Ok(UnifiedResponse::Final {
    //         //     content,
    //         //     finish_reason: reason,
    //         // })
    //     } else {
    //         Err(Error::msg("Invalid provider type for custom parsing"))
    //     }
    // }
}
