use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::Ulid;

use crate::features::workspace::dtos::WorkspaceItemContextInheritanceMode;

use super::dtos::{Chat, NewChat, UpdateChat};

pub struct ChatRepository {
    pool: Arc<SqlitePool>,
}

impl ChatRepository {
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get_all(&self, workspace_id: &str) -> Result<Vec<Chat>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool, workspace_id).await
    }

    pub async fn get(&self, chat_id: &str) -> Result<Chat, sqlx::Error> {
        self.get_with_executor(&*self.pool, chat_id).await
    }

    pub async fn get_with_executor<'e, E>(
        &self,
        executor: E,
        chat_id: &str,
    ) -> Result<Chat, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(chat_id = chat_id, "Get chat by id");

        sqlx::query_as!(Chat, "SELECT * FROM chats WHERE id = ?", chat_id)
            .fetch_one(executor)
            .await
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

    /// Create a new chat
    pub async fn create(&self, chat: NewChat) -> Result<Chat, sqlx::Error> {
        self.create_with_executor(&*self.pool, chat).await
    }

    /// Create a new chat with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        chat: NewChat,
    ) -> Result<Chat, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(
            workspace_id = chat.workspace_id,
            parent_id = chat.parent_id,
            "ChatRepository::create"
        );

        let id = Ulid::new().to_string();

        let created_chat = sqlx::query_as!(
            Chat,
            "
            INSERT INTO chats 
            (
                id,
                workspace_id,
                name,
                parent_id,
                context_inheritance_mode
            ) 
            VALUES 
            (
                ?,
                ?,
                ?,
                ?,
                ?
            )
            RETURNING *
        ",
            id,
            chat.workspace_id,
            chat.name,
            chat.parent_id,
            chat.context_inheritance_mode
        )
        .fetch_one(executor)
        .await?;

        Ok(created_chat)
    }

    pub async fn update(&self, chat: UpdateChat) -> Result<(), sqlx::Error> {
        self.update_with_executor(&*self.pool, chat).await
    }

    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        chat: UpdateChat,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(chat_id = chat.id, "ChatRepository::update");

        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE chats SET ");

        let mut separated = query_builder.separated(", ");

        if let Some(current_branch_id) = chat.current_branch_id {
            separated.push("current_branch_id = ");
            separated.push_bind_unseparated(current_branch_id);
        }

        if let Some(mcp_enabled) = chat.mcp_enabled {
            separated.push("mcp_enabled = ");
            separated.push_bind_unseparated(mcp_enabled);
        }

        separated.push_unseparated(" WHERE id = ");
        separated.push_bind_unseparated(chat.id);

        query_builder.build().execute(executor).await?;

        Ok(())
    }
}
