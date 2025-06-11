// src/ai_streams/models.rs
use serde_json::Value;

/// Represents extracted usage information from a stream.
#[derive(Debug, Clone, PartialEq, serde::Deserialize, serde::Serialize, ts_rs::TS)]
#[ts(export, export_to = "./ai-client/usage-info.type.ts")]
pub struct UsageInfo {
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub total_tokens: Option<u32>,
    // Add other common usage fields if necessary
    #[serde(flatten)] // Capture any extra fields
    #[ts(skip)] // Skip this field for TypeScript generation since Value doesn't implement TS
    pub provider_specific: Option<Value>,
}

/// Represents a piece of data extracted from a single SSE JSON payload.
#[derive(Debug, Clone)]
pub struct ParsedSsePayload {
    /// The textual content delta, if any.
    pub delta_content: Option<String>,
    /// Usage information, if present in this specific payload.
    pub usage: Option<UsageInfo>,
    /// The raw JSON string of this payload, for debugging or further processing.
    pub raw_json: String,
    /// Indicates if this payload signals the end of meaningful data from the provider
    /// (e.g. OpenAI's final message with usage but no delta).
    /// This is different from the SSE "[DONE]" signal.
    pub is_final_provider_chunk: bool,
}

/// Represents an update from the processed AI stream.
/// This is what the higher-level consumer of the stream handler will receive.
#[derive(Debug, Clone)]
pub enum StreamUpdate {
    /// A chunk of text content.
    Content(String),
    /// Final usage information, sent once at the end of the stream.
    Usage(UsageInfo),
    /// An error occurred while processing a specific part of the stream,
    /// but the stream might continue.
    StreamError { message: String, is_fatal: bool },
    // Potentially other types of updates if needed
}
