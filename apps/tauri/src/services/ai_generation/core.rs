use anyhow::Error;

use tracing::debug;

use super::service::AiGenerationService;

pub struct AiGenerationCore {
    ai_generation_service: AiGenerationService,
}

impl AiGenerationCore {
    pub fn new(ai_generation_service: AiGenerationService) -> Self {
        Self {
            ai_generation_service,
        }
    }

    pub async fn generate(&self, branch_id: &str, message: &str) -> Result<(), Error> {
        debug!(
            branch_id = branch_id,
            message = message,
            "Send message triggered"
        );

        // TODO: Get data
        // - Branch
        // - Chat
        // - Model
        // - Provider
        // - Endpoint
        let initial_ctx = self
            .ai_generation_service
            .get_initial_ctx(branch_id)
            .await?;

        // TODO: Verify data

        // TODO: Insert `user` message into db

        // TODO: Insert `assistant` node with placeholder message into db

        // TODO: Create a context
        // - Compose system prompt
        // - Handle files / tools / documents

        // TODO: Get chat history
        // - Fetch from DB

        // TODO: Convert history to model/provider compatible chat history

        // TODO: Build the request for provider, endpoint and model

        // TODO: Send a request
        // - Handle streaming response
        // - Parse response, based on data

        // TODO: Return inserted messages
        // - With formatting
        // - with new IDs

        debug!("FINISH generate");

        Ok(())
    }
}
