use std::sync::Arc;

use anyhow::Error;
use sqlx::SqlitePool;

use crate::features::{
    branch::{dtos::NewBranch, repository::BranchRepository},
    workspace::repository::WorkspaceRepository,
};

use super::{
    dtos::{Chat, NewChat, UpdateChat},
    repository::ChatRepository,
};

//
// CONSTANTS
//
const DEFAULT_CHAT_NAME: &str = "New Chat";
const DEFAULT_BRANCH_NAME: &str = "Main";

//
// SERVICE
//
pub struct ChatService {
    chat_repository: ChatRepository,
}

impl ChatService {
    pub fn new(chat_repository: ChatRepository) -> Self {
        Self { chat_repository }
    }

    /// Creates a new chat with a default branch.
    ///
    /// # Arguments
    ///
    /// * `pool` - The database connection pool
    /// * `workspace_repository` - Repository for workspace operations
    /// * `branch_repository` - Repository for branch operations  
    /// * `workspace_id` - ID of the workspace to create the chat in
    /// * `parent_id` - Optional parent chat ID for inheritance
    ///
    /// # Returns
    ///
    /// The newly created chat
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// * Database operations fail
    /// * Transaction fails to commit
    pub async fn create(
        &self,
        pool: Arc<SqlitePool>,
        workspace_repository: WorkspaceRepository,
        branch_repository: BranchRepository,
        workspace_id: String,
        parent_id: Option<String>,
    ) -> Result<Chat, Error> {
        let workspace_config = workspace_repository.select_config(&workspace_id).await?;
        let context_inheritance_mode = workspace_config.new_items_default_ctx_ihm;

        let mut tx = pool.begin().await?;

        let mut created_chat = self
            .chat_repository
            .create_with_executor(
                &mut *tx,
                NewChat {
                    name: DEFAULT_CHAT_NAME.to_string(),
                    workspace_id,
                    parent_id,
                    context_inheritance_mode: Some(context_inheritance_mode),
                },
            )
            .await?;

        let created_branch = branch_repository
            .create_with_executor(
                &mut *tx,
                NewBranch {
                    name: DEFAULT_BRANCH_NAME.to_string(),
                    chat_id: created_chat.id.clone(),
                    ..Default::default()
                },
            )
            .await?;

        self.chat_repository
            .update_with_executor(
                &mut *tx,
                UpdateChat {
                    id: created_chat.id.clone(),
                    current_branch_id: Some(created_branch.id.clone()),
                    ..Default::default()
                },
            )
            .await?;

        tx.commit().await?;

        created_chat.current_branch_id = Some(created_branch.id.clone());

        Ok(created_chat)
    }
}
