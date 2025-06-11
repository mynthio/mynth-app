// src/ai_streams/errors.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AiStreamHandlerError {
    #[error("Error mapping provider data: {0}")]
    DataMapping(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("Stream unexpectedly ended")]
    UnexpectedEndOfStream,
}

// Generic error for mappers to implement or wrap
#[derive(Error, Debug)]
pub enum ProviderMapperError {
    #[error("JSON parsing error: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("Missing required field: {0}")]
    MissingField(String),
    #[error("Invalid data format for field '{field}': {message}")]
    InvalidFormat { field: String, message: String },
    #[error("Provider specific error: {0}")]
    Other(String),
}
