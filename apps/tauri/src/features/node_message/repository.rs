use std::sync::Arc;

use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use ulid::Ulid;

use super::dtos::{NewNodeMessage, NodeMessage, UpdateNodeMessage};

#[derive(Clone)]
pub struct NodeMessageRepository {
    pool: Arc<SqlitePool>,
}

impl NodeMessageRepository {
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
        let id = node_message.id.unwrap_or_else(|| Ulid::new().to_string());

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

    pub async fn get_all_by_node_id(&self, node_id: &str) -> Result<Vec<NodeMessage>, sqlx::Error> {
        self.get_all_by_node_id_with_executor(&*self.pool, node_id)
            .await
    }

    pub async fn get_all_by_node_id_with_executor<'e, E>(
        &self,
        executor: E,
        node_id: &str,
    ) -> Result<Vec<NodeMessage>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let messages = sqlx::query_as!(
            NodeMessage,
            "SELECT * FROM node_messages WHERE node_id = ? ORDER BY version_number DESC",
            node_id
        )
        .fetch_all(executor)
        .await?;

        Ok(messages)
    }

    /// Create many messages for nodes
    pub async fn create_many(&self, node_messages: Vec<NewNodeMessage>) -> sqlx::Result<()> {
        self.create_many_with_executor(&*self.pool, node_messages)
            .await
    }

    /// Create many messages for nodes with a specified executor
    pub async fn create_many_with_executor<'e, E>(
        &self,
        executor: E,
        node_messages: Vec<NewNodeMessage>,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        if node_messages.is_empty() {
            return Ok(());
        }

        // The BIND_LIMIT for SQLite is 32766.
        // Each node_message has 5 fields (id, node_id, content, version_number, status).
        // So, we can insert at most 32766 / 5 = 6553 messages at a time.
        // This is a rather generous limit, so we'll just use it as is for now.
        // It's a good idea to chunk the inserts if you anticipate a very large number of messages.
        const BIND_LIMIT_NODE_MESSAGES: usize = 32766 / 6;

        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(
            "INSERT INTO node_messages (id, node_id, content, version_number, status, model_id)",
        );

        let mut ulid_generator = ulid::Generator::new();

        query_builder.push_values(
            node_messages.into_iter().take(BIND_LIMIT_NODE_MESSAGES),
            |mut b, message| {
                b.push_bind(
                    message
                        .id
                        .unwrap_or_else(|| ulid_generator.generate().unwrap().to_string()),
                ) // Generate new ULID for each message
                .push_bind(message.node_id)
                .push_bind(message.content)
                .push_bind(message.version_number)
                .push_bind(message.status)
                .push_bind(message.model_id);
            },
        );

        query_builder.build().execute(executor).await?;

        Ok(())
    }

    pub async fn update(&self, node_message: UpdateNodeMessage) -> sqlx::Result<()> {
        self.update_with_executor(&*self.pool, node_message).await
    }

    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        update: UpdateNodeMessage,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let mut query_builder: QueryBuilder<Sqlite> =
            QueryBuilder::new("UPDATE node_messages SET ");

        let mut separated = query_builder.separated(", ");

        if let Some(content) = update.content {
            separated.push("content = ");
            separated.push_bind_unseparated(content);
        }

        if let Some(status) = update.status {
            separated.push("status = ");
            separated.push_bind_unseparated(status);
        }

        query_builder.push(" WHERE id = ");
        query_builder.push_bind(update.id);

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
