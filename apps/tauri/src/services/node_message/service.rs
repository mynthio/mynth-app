use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use ulid::Ulid;

use super::dtos::{NewNodeMessage, NodeMessage, UpdateNodeMessage};

#[derive(Clone)]
pub struct NodeMessageService {
    pool: Arc<SqlitePool>,
}

impl NodeMessageService {
    /// Create a new chat node message service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// Create a message for a node
    pub async fn create(&self, node_message: NewNodeMessage) -> sqlx::Result<String> {
        self.create_with_executor(&*self.pool, node_message).await
    }

    /// Create a message for a node with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        node_message: NewNodeMessage,
    ) -> sqlx::Result<String>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let id = Ulid::new().to_string();

        sqlx::query("INSERT INTO node_messages (id, node_id, content, version_number, status) VALUES (?, ?, ?, ?, ?)")
            .bind(&id)
            .bind(node_message.node_id)
            .bind(node_message.content)
            .bind(node_message.version_number)
            .bind(node_message.status)
        .execute(executor)
        .await?;

        Ok(id)
    }

    pub async fn update(&self, id: &str, node_message: UpdateNodeMessage) -> sqlx::Result<()> {
        self.update_with_executor(&*self.pool, id, node_message)
            .await
    }

    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
        update: UpdateNodeMessage,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let mut query_builder: QueryBuilder<Sqlite> =
            QueryBuilder::new("UPDATE node_messages SET ");

        let mut separated = query_builder.separated(", ");

        if let Some(content) = update.content {
            separated.push("content = ?");
            separated.push_bind(content);
        }

        if let Some(status) = update.status {
            separated.push("status = ?");
            separated.push_bind(status);
        }

        query_builder.push("WHERE id = ?");
        query_builder.push_bind(id);

        query_builder.build().execute(executor).await?;

        Ok(())
    }

    pub async fn delete_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query("DELETE FROM node_messages WHERE id = ?")
            .bind(id)
            .execute(executor)
            .await?;
        Ok(())
    }

    // Get all messages for a node
    pub async fn get(&self, id: &str) -> Result<NodeMessage, sqlx::Error> {
        let message = sqlx::query_as!(NodeMessage, "SELECT * FROM node_messages WHERE id = ?", id)
            .fetch_one(&*self.pool)
            .await?;
        Ok(message)
    }

    pub async fn find_all_by_node_id(
        &self,
        node_id: &str,
    ) -> Result<Vec<NodeMessage>, sqlx::Error> {
        let messages = sqlx::query_as!(
            NodeMessage,
            "SELECT * FROM node_messages WHERE node_id = ? ORDER BY version_number DESC",
            node_id
        )
        .fetch_all(&*self.pool)
        .await?;
        Ok(messages)
    }
}
