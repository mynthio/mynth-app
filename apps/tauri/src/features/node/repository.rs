use std::sync::Arc;

use chrono::Utc;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::{Generator, Ulid};

use super::dtos::{NewNode, Node, UpdateNode};

const BIND_LIMIT: usize = 32766;

#[derive(Clone)]
pub struct NodeRepository {
    pool: Arc<SqlitePool>,
}

impl NodeRepository {
    /// Create a new node repository
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get(&self, id: &str) -> Result<Node, sqlx::Error> {
        self.get_with_executor(&*self.pool, id).await
    }

    pub async fn get_with_executor<'e, E>(&self, executor: E, id: &str) -> Result<Node, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let node = sqlx::query_as!(
            Node,
            r#"
            SELECT
                nodes.id,
                nodes.type,
                nodes.role,
                nodes.branch_id,
                node_messages.id as message_id,
                node_messages.content as message_content,
                node_messages.model_id as message_model_id,
                node_messages.version_number as message_version_number,
                (SELECT COUNT(*) FROM node_messages WHERE node_messages.node_id = nodes.id) as "message_version_count: i64",
                nodes.extensions,
                nodes.updated_at
            FROM nodes
            LEFT JOIN node_messages
                ON nodes.active_message_id = node_messages.id
            WHERE nodes.id = ?
            "#,
            id
        )
        .fetch_one(executor)
        .await?;

        Ok(node)
    }

    pub async fn get_all_by_branch_id(&self, branch_id: &str) -> Result<Vec<Node>, sqlx::Error> {
        let nodes = sqlx::query_as!(
            Node,
            r#"
            SELECT
                nodes.id,
                nodes.type,
                nodes.role,
                nodes.branch_id,
                node_messages.id as message_id,
                node_messages.content as message_content,
                node_messages.model_id as message_model_id,
                node_messages.version_number as message_version_number,
                (SELECT COUNT(*) FROM node_messages WHERE node_messages.node_id = nodes.id) as "message_version_count: i64",
                nodes.extensions,
                nodes.updated_at
            FROM nodes
            LEFT JOIN node_messages
                ON nodes.active_message_id = node_messages.id
            WHERE branch_id = ?
            ORDER BY nodes.id ASC
            "#,
            branch_id
        )
        .fetch_all(&*self.pool)
        .await?;

        Ok(nodes)
    }

    pub async fn get_all_by_branch_id_and_after_node_id(
        &self,
        branch_id: &str,
        after_node_id: &str,
    ) -> Result<Vec<Node>, sqlx::Error> {
        let nodes = sqlx::query_as!(
            Node,
            r#"
            SELECT
                nodes.id,
                nodes.type,
                nodes.role,
                nodes.branch_id,
                node_messages.id as message_id,
                node_messages.content as message_content,
                node_messages.model_id as message_model_id,
                node_messages.version_number as message_version_number,
                (SELECT COUNT(*) FROM node_messages WHERE node_messages.node_id = nodes.id) as "message_version_count: i64",
                nodes.extensions,
                nodes.updated_at
            FROM nodes
            LEFT JOIN node_messages
                ON nodes.active_message_id = node_messages.id
            WHERE branch_id = ? AND nodes.id < ?
            ORDER BY nodes.id ASC
            "#,
            branch_id,
            after_node_id
        )
        .fetch_all(&*self.pool)
        .await?;

        Ok(nodes)
    }

    /// Create a node
    pub async fn create(&self, node: NewNode) -> Result<(), sqlx::Error> {
        self.create_with_executor(&*self.pool, node).await
    }

    /// Create a node with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        node: NewNode,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let id = node.id.unwrap_or(Ulid::new().to_string());

        sqlx::query!(
            r#"
            INSERT INTO nodes (
                id,
                type,
                role,
                branch_id,
                active_message_id,
                active_tool_use_id,
                updated_at,
                extensions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            id,
            node.r#type,
            node.role,
            node.branch_id,
            node.active_message_id,
            node.active_tool_use_id,
            node.updated_at,
            node.extensions
        )
        .execute(executor)
        .await?;

        Ok(())
    }

    /// Create many nodes with a specified executor
    pub async fn create_many_with_executor<'e, E>(
        &self,
        executor: E,
        nodes: Vec<NewNode>,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        if nodes.is_empty() {
            return Ok(());
        }

        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(
            "
            INSERT INTO
              nodes
              (
                id,
                type,
                role,
                branch_id,
                active_message_id,
                active_tool_use_id,
                updated_at,
                extensions
              )
            ",
        );

        /*
         * Generate ULIDs without collisions.
         * https://docs.rs/ulid/latest/ulid/struct.Generator.html
         */
        let mut ulid_generator = Generator::new();

        query_builder.push_values(nodes.into_iter().take(BIND_LIMIT / 9), |mut b, node| {
            b.push_bind(
                node.id
                    .unwrap_or(ulid_generator.generate().unwrap().to_string()),
            );
            b.push_bind(node.r#type);
            b.push_bind(node.role);
            b.push_bind(node.branch_id);
            b.push_bind(node.active_message_id);
            b.push_bind(node.active_tool_use_id);
            b.push_bind(node.updated_at);
            b.push_bind(node.extensions);
        });

        query_builder.build().execute(executor).await?;

        Ok(())
    }

    /// Update a node
    pub async fn update(&self, node: UpdateNode) -> Result<(), sqlx::Error> {
        self.update_with_executor(&*self.pool, node).await
    }

    /// Update a node with a specified executor
    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        node: UpdateNode,
    ) -> Result<(), sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        debug!(node_id = node.id, "NodeRepository::update");

        // Initialize QueryBuilder for SQLite
        let mut query_builder: QueryBuilder<sqlx::Sqlite> = QueryBuilder::new("UPDATE nodes SET ");

        // Build the SET clause dynamically
        let mut separated = query_builder.separated(", ");

        if let Some(r#type) = node.r#type {
            separated.push("type = ");
            separated.push_bind_unseparated(r#type);
        }

        if let Some(role) = node.role {
            separated.push("role = ");
            separated.push_bind_unseparated(role);
        }

        if let Some(branch_id) = node.branch_id {
            separated.push("branch_id = ");
            separated.push_bind_unseparated(branch_id);
        }

        if let Some(active_message_id) = node.active_message_id {
            separated.push("active_message_id = ");
            separated.push_bind_unseparated(active_message_id);
        }

        if let Some(active_tool_use_id) = node.active_tool_use_id {
            separated.push("active_tool_use_id = ");
            separated.push_bind_unseparated(active_tool_use_id);
        }

        if let Some(extensions) = node.extensions {
            separated.push("extensions = ");
            separated.push_bind_unseparated(extensions);
        }

        // Always update the updated_at timestamp
        separated.push("updated_at = ");
        separated.push_bind_unseparated(chrono::Utc::now());

        // Add WHERE clause and RETURNING clause
        query_builder.push(" WHERE id = ").push_bind(node.id);

        // Prepare the query
        let query = query_builder.build();

        // Execute the query and map to Node struct
        query.execute(executor).await?;

        Ok(())
    }
}
