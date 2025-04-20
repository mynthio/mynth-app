use sqlx::{Executor, Row, Sqlite};
use std::sync::Arc;
use tracing::{error, info};
use ulid::Ulid;

use super::database::DbPool;

/// Service responsible for chat node message operations
#[derive(Clone)]
pub struct ChatNodeMessageService {
    pool: Arc<DbPool>,
}

impl ChatNodeMessageService {
    /// Create a new chat node message service
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }

    pub async fn get_next_version_number(&self, node_id: &str) -> sqlx::Result<i64> {
        self.get_next_version_number_with_executor(self.pool.get(), node_id)
            .await
    }

    pub async fn get_next_version_number_with_executor<'e, E>(
        &self,
        executor: E,
        node_id: &str,
    ) -> sqlx::Result<i64>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let row = sqlx::query(
            "SELECT COALESCE(MAX(version_number), 0) + 1 FROM chat_node_messages WHERE node_id = ?",
        )
        .bind(node_id)
        .fetch_one(executor)
        .await?;

        Ok(row.get::<i64, _>(0))
    }

    /// Create a message for a node
    pub async fn create(
        &self,
        node_id: &str,
        content: &str,
        version_number: i64,
        status: &str,
    ) -> sqlx::Result<String> {
        self.create_with_executor(self.pool.get(), node_id, content, version_number, status)
            .await
    }

    /// Create a message for a node with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        node_id: &str,
        content: &str,
        version_number: i64,
        status: &str,
    ) -> sqlx::Result<String>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let content_id = Ulid::new().to_string();
        sqlx::query!("INSERT INTO chat_node_messages (id, node_id, content, version_number, status) VALUES (?, ?, ?, ?, ?)",
            content_id,
            node_id,
            content,
            version_number,
            status
        )
        .execute(executor)
        .await?;

        Ok(content_id)
    }

    pub async fn update(&self, content_id: &str, new_content: &str) -> sqlx::Result<()> {
        self.update_with_executor(self.pool.get(), content_id, new_content)
            .await
    }

    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        content_id: &str,
        new_content: &str,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query("UPDATE chat_node_messages SET content = ? WHERE id = ?")
            .bind(new_content)
            .bind(content_id)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn update_status(&self, content_id: &str, new_status: &str) -> sqlx::Result<()> {
        self.update_status_with_executor(self.pool.get(), content_id, new_status)
            .await
    }

    pub async fn update_status_with_executor<'e, E>(
        &self,
        executor: E,
        content_id: &str,
        new_status: &str,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query("UPDATE chat_node_messages SET status = ? WHERE id = ?")
            .bind(new_status)
            .bind(content_id)
            .execute(executor)
            .await?;

        Ok(())
    }

    pub async fn delete(&self, content_id: &str) -> sqlx::Result<()> {
        self.delete_with_executor(self.pool.get(), content_id).await
    }

    pub async fn delete_with_executor<'e, E>(
        &self,
        executor: E,
        content_id: &str,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query("DELETE FROM chat_node_messages WHERE id = ?")
            .bind(content_id)
            .execute(executor)
            .await?;

        Ok(())
    }
}
