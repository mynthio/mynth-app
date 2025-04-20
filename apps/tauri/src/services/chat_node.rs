use serde::{Deserialize, Serialize};
use sqlx::{Row, Sqlite};
use std::sync::Arc;
use tracing::{error, info};
use ulid::Ulid;

use super::chat_node_message::ChatNodeMessageService;
use super::database::DbPool;
use crate::models::chat::ChatNodeType;
use crate::models::node_type::NodeType;
use std::str::FromStr;

/// Parameters for updating a chat node
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpdateChatNodeParams {
    pub node_type: Option<String>,
    pub parent_id: Option<String>,
    pub active_message_id: Option<String>,
}

/// Service responsible for chat node operations
#[derive(Clone)]
pub struct ChatNodeService {
    pool: Arc<DbPool>,
}

impl ChatNodeService {
    /// Create a new chat node service
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }

    /// Create a new chat node
    pub async fn create(
        &self,
        branch_id: &str,
        node_type: &str,
        parent_id: Option<&str>,
    ) -> sqlx::Result<String> {
        self.create_with_executor(self.pool.get(), branch_id, node_type, parent_id)
            .await
    }

    /// Create a new chat node with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        branch_id: &str,
        node_type: &str,
        parent_id: Option<&str>,
    ) -> sqlx::Result<String>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let node_id = Ulid::new().to_string();

        sqlx::query!(
            r#"
            INSERT INTO chat_nodes 
            (id, node_type, branch_id, parent_id, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            "#,
            node_id,
            node_type,
            branch_id,
            parent_id
        )
        .execute(executor)
        .await?;

        Ok(node_id)
    }

    /// Create a new chat node with content
    ///
    /// This function:
    /// 1. Creates a new chat node
    /// 2. Creates a content version for the node
    /// 3. Links the content version to the node
    /// 4. Returns the node ID
    pub async fn create_node(
        &self,
        branch_id: &str,
        node_type: &str,
        content: &str,
        parent_id: Option<&str>,
    ) -> sqlx::Result<String> {
        info!(
            "Creating {} node in branch {} with parent_id: {:?}",
            node_type, branch_id, parent_id
        );

        // Generate IDs for the node and its content version
        let node_id = Ulid::new().to_string();
        let content_version_id = Ulid::new().to_string();

        // Start a transaction
        let mut tx = self.pool.get().begin().await?;

        // 1. Insert chat node first without active_message_id
        let query = sqlx::query!(
            r#"
            INSERT INTO chat_nodes 
            (id, node_type, branch_id, parent_id, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            "#,
            node_id,
            node_type,
            branch_id,
            parent_id
        )
        .execute(&mut *tx)
        .await;

        if let Err(e) = query {
            error!("Failed to insert chat node: {:?}", e);
            let _ = tx.rollback().await;
            return Err(e);
        }

        // 2. Insert the content version
        let query = sqlx::query!(
            r#"
            INSERT INTO chat_node_messages
            (id, content, version_number, node_id, status)
            VALUES (?, ?, 1, ?, 'published')
            "#,
            content_version_id,
            content,
            node_id
        )
        .execute(&mut *tx)
        .await;

        if let Err(e) = query {
            error!("Failed to insert content version: {:?}", e);
            let _ = tx.rollback().await;
            return Err(e);
        }

        // 3. Update the chat node with the content version ID
        let query = sqlx::query!(
            r#"
            UPDATE chat_nodes
            SET active_message_id = ?
            WHERE id = ?
            "#,
            content_version_id,
            node_id
        )
        .execute(&mut *tx)
        .await;

        if let Err(e) = query {
            error!("Failed to update chat node with content version: {:?}", e);
            let _ = tx.rollback().await;
            return Err(e);
        }

        // Commit the transaction
        tx.commit().await?;

        info!(
            "Successfully created {} node with ID: {}",
            node_type, node_id
        );
        Ok(node_id)
    }

    /// Get the latest nodes from a branch
    pub async fn get_latest_nodes(
        &self,
        branch_id: &str,
        limit: i64,
    ) -> sqlx::Result<Vec<sqlx::sqlite::SqliteRow>> {
        sqlx::query(
            r#"
            SELECT cn.id, cn.node_type, cn.active_message_id, cv.content
            FROM chat_nodes cn
            LEFT JOIN chat_node_messages cv ON cn.active_message_id = cv.id
            WHERE cn.branch_id = ?
            AND cn.node_type IN (?, ?)
            ORDER BY cn.updated_at DESC
            LIMIT ?
            "#,
        )
        .bind(branch_id)
        .bind(ChatNodeType::UserMessage.to_string())
        .bind(ChatNodeType::AssistantMessage.to_string())
        .bind(limit)
        .fetch_all(self.pool.get())
        .await
    }

    /// Create a new content version for an existing node and update its active_message_id
    ///
    /// This function:
    /// 1. Creates a new content version for the node
    /// 2. Updates the node's active_message_id to point to the new content version
    /// 3. Returns the new content version ID
    pub async fn create_content_version_and_update_node(
        &self,
        node_id: &str,
        content: &str,
    ) -> sqlx::Result<String> {
        info!("Creating new content version for node ID: {}", node_id);

        // Generate ID for the new content version
        let content_version_id = Ulid::new().to_string();
        let content_version_id_clone = content_version_id.clone(); // Clone before using it

        // Start a transaction
        let mut tx = self.pool.get().begin().await?;

        // Get the current version number
        let current_version = sqlx::query(
            r#"
            SELECT MAX(version_number) as max_version 
            FROM chat_node_messages 
            WHERE node_id = ?
            "#,
        )
        .bind(node_id)
        .fetch_one(&mut *tx)
        .await?;

        let max_version: Option<i64> = current_version.get("max_version");
        let new_version_number = max_version.unwrap_or(0) + 1;

        // 1. Insert the new content version
        let query = sqlx::query(
            r#"
            INSERT INTO chat_node_messages
            (id, content, version_number, node_id, status)
            VALUES (?, ?, ?, ?, 'published')
            "#,
        )
        .bind(&content_version_id)
        .bind(content)
        .bind(new_version_number)
        .bind(node_id)
        .execute(&mut *tx)
        .await;

        if let Err(e) = query {
            error!("Failed to insert content version: {:?}", e);
            let _ = tx.rollback().await;
            return Err(e);
        }

        // 2. Update the chat node with the new content version ID
        let query = sqlx::query(
            r#"
            UPDATE chat_nodes
            SET active_message_id = ?, updated_at = datetime('now')
            WHERE id = ?
            "#,
        )
        .bind(&content_version_id)
        .bind(node_id)
        .execute(&mut *tx)
        .await;

        if let Err(e) = query {
            error!("Failed to update chat node with content version: {:?}", e);
            let _ = tx.rollback().await;
            return Err(e);
        }

        // Commit the transaction
        tx.commit().await?;

        info!(
            "Successfully updated node with new content version: {}",
            content_version_id
        );
        Ok(content_version_id_clone)
    }

    /// Set content version for a node using the ChatNodeMessageService
    ///
    /// This function:
    /// 1. Creates a new content version with the next version number
    /// 2. Updates the node's active_message_id to point to the new content version
    /// 3. Returns the new content version ID
    pub async fn set_content_version(
        &self,
        node_id: &str,
        content: &str,
        content_version_service: &ChatNodeMessageService,
    ) -> sqlx::Result<String> {
        info!("Setting new content version for node ID: {}", node_id);

        // Start a transaction
        let mut tx = self.pool.get().begin().await?;

        // Get the next version number
        let version_number = content_version_service
            .get_next_version_number_with_executor(&mut *tx, node_id)
            .await?;

        // Create the content version
        let content_version_id = content_version_service
            .create_with_executor(&mut *tx, node_id, content, version_number, "published")
            .await?;

        // Update the chat node with the new content version ID using the update_with_executor method
        let update_params = UpdateChatNodeParams {
            active_message_id: Some(content_version_id.clone()),
            ..Default::default()
        };

        self.update_with_executor(&mut *tx, node_id, update_params)
            .await?;

        // Commit the transaction
        tx.commit().await?;

        info!(
            "Successfully set node content version: {}",
            content_version_id
        );
        Ok(content_version_id)
    }

    /// Update a chat node with the given parameters
    ///
    /// Only fields that are Some will be updated
    pub async fn update(&self, node_id: &str, params: UpdateChatNodeParams) -> sqlx::Result<()> {
        info!("Updating chat node with id: {}", node_id);
        self.update_with_executor(self.pool.get(), node_id, params)
            .await
    }

    /// Update a chat node with the given parameters using the provided executor
    ///
    /// Only fields that are Some will be updated
    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        node_id: &str,
        params: UpdateChatNodeParams,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let mut updates = Vec::new();
        let mut binds = Vec::new();

        if let Some(node_type) = &params.node_type {
            updates.push("node_type = ?");
            binds.push(node_type.as_str());
        }

        if let Some(parent_id) = &params.parent_id {
            updates.push("parent_id = ?");
            binds.push(parent_id.as_str());
        }

        if let Some(active_message_id) = &params.active_message_id {
            updates.push("active_message_id = ?");
            binds.push(active_message_id.as_str());
        }

        if updates.is_empty() {
            info!("No chat node updates provided, skipping update");
            return Ok(());
        }

        // Add updated_at timestamp to the updates
        updates.push("updated_at = datetime('now')");

        let updates_str = updates.join(", ");
        let query = format!(
            r#"
            UPDATE chat_nodes
            SET {updates_str}
            WHERE id = ?
            "#
        );

        // Build the query with bindings
        let mut query_builder = sqlx::query(&query);
        for bind in binds {
            query_builder = query_builder.bind(bind);
        }
        query_builder = query_builder.bind(node_id);

        // Execute the query
        query_builder.execute(executor).await?;

        info!("Successfully updated chat node: {}", node_id);
        Ok(())
    }

    /// Create a new chat node with an associated message
    ///
    /// This function:
    /// 1. Creates a new chat node
    /// 2. Creates a message for the node
    /// 3. Updates the node with the message ID
    pub async fn create_node_with_message(
        &self,
        branch_id: &str,
        node_type: &str,
        content: &str,
        parent_id: Option<&str>,
        message_service: &ChatNodeMessageService,
    ) -> sqlx::Result<(String, String)> {
        // Start a transaction
        let mut tx = self.pool.get().begin().await?;

        // Create the node
        let node_id = self
            .create_with_executor(&mut *tx, branch_id, node_type, parent_id)
            .await?;

        // Create the message with version 1
        let message_id = message_service
            .create_with_executor(&mut *tx, &node_id, content, 1, "published")
            .await?;

        // Update node with the active message
        let update_params = UpdateChatNodeParams {
            active_message_id: Some(message_id.clone()),
            ..Default::default()
        };
        self.update_with_executor(&mut *tx, &node_id, update_params)
            .await?;

        // Commit the transaction
        tx.commit().await?;

        Ok((node_id, message_id))
    }

    /// Get a chat node by its ID
    ///
    /// This function fetches a single chat node by its ID and includes its active message content
    pub async fn get_node(&self, node_id: &str) -> sqlx::Result<crate::models::chat::ChatNode> {
        info!("Fetching chat node with ID: {}", node_id);

        let row = sqlx::query(
            r#"
            SELECT 
                chat_nodes.id,
                chat_nodes.node_type,
                chat_nodes.branch_id,
                chat_nodes.parent_id,
                chat_nodes.active_message_id,
                chat_nodes.updated_at,
                content_versions.id as cv_id,
                content_versions.content as cv_content,
                content_versions.version_number as cv_version_number,
                content_versions.node_id as cv_node_id,
                content_versions.status,
                content_versions.token_count as cv_token_count,
                content_versions.cost as cv_cost,
                content_versions.api_metadata as cv_api_metadata,
                content_versions.model_id as cv_model_id,
                (SELECT COUNT(*) FROM chat_node_messages WHERE node_id = chat_nodes.id) as message_count
            FROM chat_nodes
            LEFT JOIN chat_node_messages as content_versions ON chat_nodes.active_message_id = content_versions.id
            WHERE chat_nodes.id = ?
            "#,
        )
        .bind(node_id)
        .fetch_one(self.pool.get())
        .await?;

        // Map the row to ChatNode and ContentVersion
        let node = crate::models::chat::ChatNode {
            id: row.get("id"),
            node_type: row.get("node_type"),
            branch_id: row.get("branch_id"),
            parent_id: row.get("parent_id"),
            active_message_id: row.get("active_message_id"),
            active_tool_use_id: None,
            updated_at: row.get("updated_at"),
            extensions: Default::default(),
            active_message: if row.try_get::<Option<String>, _>("cv_id")?.is_some() {
                Some(crate::models::chat::ContentVersion {
                    id: row.get("cv_id"),
                    content: row.get("cv_content"),
                    version_number: row.get::<i64, _>("cv_version_number") as i32,
                    status: row.get("status"),
                    node_id: row.get("cv_node_id"),
                    token_count: row.try_get("cv_token_count").ok(),
                    cost: row.try_get("cv_cost").ok(),
                    api_metadata: row.try_get("cv_api_metadata").ok(),
                    model_id: row.try_get("cv_model_id").ok(),
                    extensions: Default::default(),
                })
            } else {
                None
            },
            message_count: row.try_get("message_count").ok(),
            active_tool_use: None,
        };

        Ok(node)
    }

    /// Get all message nodes from a branch in chronological order
    ///
    /// This function fetches all user and assistant messages from a branch
    /// and returns them sorted by creation time (oldest first)
    ///
    /// Returns empty vector if no messages are found, but panics on database errors
    pub async fn get_branch_messages(&self, branch_id: &str) -> Vec<sqlx::sqlite::SqliteRow> {
        info!("Fetching all message nodes for branch: {}", branch_id);

        match sqlx::query(
            r#"
            SELECT cn.id, cn.node_type, cn.active_message_id, cv.content, cv.token_count, cn.updated_at
            FROM chat_nodes cn
            LEFT JOIN chat_node_messages cv ON cn.active_message_id = cv.id
            WHERE cn.branch_id = ?
            AND cn.node_type IN ('user_message', 'assistant_message')
            ORDER BY cn.id ASC
            "#,
        )
        .bind(branch_id)
        .fetch_all(self.pool.get())
        .await {
            Ok(nodes) => nodes,
            Err(err) => {
                // Log the error and panic - this is a critical database error
                error!("CRITICAL DATABASE ERROR while fetching branch messages: {:?}", err);
                panic!("Database error: {:?}", err);
            }
        }
    }
}
