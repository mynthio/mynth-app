use crate::services::ai::AiServiceError;
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "type", content = "details")] // Makes it easy for frontend to switch on 'type'
pub enum CommandError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),

    #[error("Database error: {0}")]
    Database(String), // Avoid exposing raw DB error details

    #[error("Internal service error: {0}")]
    Internal(String), // Catch-all for other service errors
}

impl From<AiServiceError> for CommandError {
    fn from(err: AiServiceError) -> Self {
        // Keep the logging within the command handler for context,
        // but map the error type here.
        match err {
            AiServiceError::NotFound(msg) => CommandError::NotFound(msg),
            AiServiceError::InvalidParameter(msg) => CommandError::InvalidParameter(msg),
            // Convert the DB error to a user-friendly string
            AiServiceError::Database(db_err) => CommandError::Database(db_err.to_string()),
            // Use the generic error's message for Internal
            // You might want more specific mapping if AiServiceError grows more variants
        }
    }
}
