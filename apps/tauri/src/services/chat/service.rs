use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};
use tracing::debug;

use super::dtos::Chat;

pub struct ChatService {
    pool: Arc<SqlitePool>,
}

impl ChatService {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get_all(&self, workspace_id: &str) -> Result<Vec<Chat>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool, workspace_id).await
    }

    pub async fn get_all_with_executor<'e, E>(
        &self,
        executor: E,
        workspace_id: &str,
    ) -> Result<Vec<Chat>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(workspace_id = workspace_id, "Get all chats");

        sqlx::query_as!(
            Chat,
            "
              SELECT *
              FROM chats 
              WHERE 
                workspace_id = ? 
            ",
            workspace_id
        )
        .fetch_all(executor)
        .await
    }

    pub async fn find_all_by_parent_id(
        &self,
        workspace_id: &str,
        parent_id: Option<&str>,
    ) -> Result<Vec<Chat>, sqlx::Error> {
        self.find_all_by_parent_id_with_executor(&*self.pool, workspace_id, parent_id)
            .await
    }

    /// Find all folders by parent id with a specified executor
    pub async fn find_all_by_parent_id_with_executor<'e, E>(
        &self,
        executor: E,
        workspace_id: &str,
        parent_id: Option<&str>,
    ) -> Result<Vec<Chat>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(
            workspace_id = workspace_id,
            parent_id = parent_id,
            "Find all chats by parent id"
        );

        sqlx::query_as!(
            Chat,
            "
              SELECT *
              FROM chats 
              WHERE 
                workspace_id = ? 
                AND parent_id = ?
            ",
            workspace_id,
            parent_id
        )
        .fetch_all(executor)
        .await
    }
}
