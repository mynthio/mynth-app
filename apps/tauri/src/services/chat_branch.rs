use super::database::DbPool;
use crate::models::chat::ChatNode;
use crate::models::chat::ChatNodesResponse;
use crate::models::chat::ContentVersion;
use crate::models::chat_branch::Branch;
use crate::models::chat_branch::UpdateBranchParams;
use crate::models::mcp::ChatNodeMcpToolUse;
use crate::utils::markdown::markdown_to_html;
use sqlx::{Executor, QueryBuilder, Row, Sqlite};
use std::sync::Arc;
use tracing::{error, info};
use ulid::Ulid;

/// Service for handling chat branch operations
pub struct ChatBranchService {
    pool: Arc<DbPool>,
}

impl ChatBranchService {
    /// Create a new chat branch service
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }

    /// Create a new branch
    pub async fn create(
        &self,
        chat_id: &str,
        name: &str,
        model_id: Option<&str>,
    ) -> sqlx::Result<String> {
        self.create_with_executor(self.pool.get(), chat_id, name, model_id)
            .await
    }

    /// Create a new branch with a specified executor
    pub async fn create_with_executor<'e, E>(
        &self,
        executor: E,
        chat_id: &str,
        name: &str,
        model_id: Option<&str>,
    ) -> sqlx::Result<String>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let branch_id = Ulid::new().to_string();

        sqlx::query!(
            r#"
            INSERT INTO chat_branches (id, chat_id, name, model_id)
            VALUES (?, ?, ?, ?)
            "#,
            branch_id,
            chat_id,
            name,
            model_id
        )
        .execute(executor)
        .await?;

        Ok(branch_id)
    }

    /// Update a branch
    pub async fn update(&self, branch_id: &str, params: UpdateBranchParams) -> sqlx::Result<()> {
        self.update_with_executor(self.pool.get(), branch_id, params)
            .await
    }

    /// Update a branch with a specified executor
    pub async fn update_with_executor<'e, E>(
        &self,
        executor: E,
        branch_id: &str,
        params: UpdateBranchParams,
    ) -> sqlx::Result<()>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        info!(
            "Updating branch with id: {}, params: {:?}",
            branch_id, params
        );

        let mut query_builder = QueryBuilder::new("UPDATE chat_branches SET ");
        let mut separated = query_builder.separated(", ");

        if let Some(name) = params.name {
            separated.push("name = ").push_bind_unseparated(name);
        }

        if let Some(model_id) = params.model_id {
            separated
                .push("model_id = ")
                .push_bind_unseparated(model_id);
        }

        // Always update the timestamp if we're executing an update
        separated.push("updated_at = datetime('now')");

        query_builder.push(" WHERE id = ").push_bind(branch_id);

        info!("Executing query: {}", query_builder.sql());
        let query = query_builder.build();

        if let Err(err) = query.execute(executor).await {
            error!("Failed to execute branch update query: {}", err);
            return Err(err);
        }

        info!("Successfully completed branch update for id: {}", branch_id);
        Ok(())
    }

    /// Get a chat branch by its ID
    pub async fn get_branch(&self, branch_id: &str) -> sqlx::Result<Option<Branch>> {
        info!("Fetching branch with id: {}", branch_id);

        let branch = sqlx::query_as::<_, Branch>(
            r#"
            SELECT *
            FROM chat_branches
            WHERE id = ?
            "#,
        )
        .bind(branch_id)
        .fetch_optional(self.pool.get())
        .await?;

        info!(
            "Branch fetch result for id {}: {}",
            branch_id,
            if branch.is_some() {
                "found"
            } else {
                "not found"
            }
        );

        Ok(branch)
    }

    /// Get chat nodes for a specific branch with pagination
    pub async fn get_chat_nodes(
        &self,
        branch_id: &str,
        after_node_id: Option<&str>,
    ) -> sqlx::Result<ChatNodesResponse> {
        info!(
            "Fetching chat nodes for branch: {} with pagination cursor: {:?}",
            branch_id, after_node_id
        );

        // For initial load (no cursor), we want the most recent messages
        // For pagination (with cursor), we want messages older than the cursor
        if after_node_id.is_none() {
            // Initial load - get most recent messages in descending order then reverse them
            let query = r#"
                SELECT 
                    chat_nodes.id,
                    chat_nodes.node_type,
                    chat_nodes.branch_id,
                    chat_nodes.parent_id,
                    chat_nodes.active_message_id,
                    chat_nodes.active_tool_use_id,
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
                    tool_use.id as tu_id,
                    tool_use.input as tu_input,
                    tool_use.output as tu_output,
                    tool_use.status as tu_status,
                    tool_use.error as tu_error,
                    tool_use.version_number as tu_version_number,
                    tool_use.node_id as tu_node_id,
                    tool_use.tool_id as tu_tool_id,
                    (SELECT COUNT(*) FROM chat_node_messages WHERE node_id = chat_nodes.id) as message_count
                FROM chat_nodes
                LEFT JOIN chat_node_messages as content_versions ON chat_nodes.active_message_id = content_versions.id
                LEFT JOIN chat_node_mcp_tool_use as tool_use ON chat_nodes.active_tool_use_id = tool_use.id
                WHERE chat_nodes.branch_id = ?
                ORDER BY chat_nodes.id DESC
            "#;

            let rows = sqlx::query(query)
                .bind(branch_id)
                .fetch_all(self.pool.get())
                .await?;

            // Manually map rows to ChatNode structs
            let mut nodes = Vec::with_capacity(rows.len());
            for row in rows {
                // Check if cv_id exists and isn't null
                let content_version = match row.try_get::<Option<String>, _>("cv_id")? {
                    Some(cv_id) => {
                        let markdown_content: String = row.get("cv_content");
                        // Convert markdown to HTML
                        let html_content = markdown_to_html(&markdown_content);

                        Some(ContentVersion {
                            id: cv_id,
                            content: html_content,
                            version_number: row.get("cv_version_number"),
                            node_id: row.get("cv_node_id"),
                            status: row
                                .try_get("status")
                                .unwrap_or_else(|_| "published".to_string()),
                            token_count: row.try_get("cv_token_count").ok(),
                            cost: row.try_get("cv_cost").ok(),
                            api_metadata: row.try_get("cv_api_metadata").ok(),
                            model_id: row.try_get("cv_model_id").ok(),
                            extensions: row.try_get("cv_extensions").ok(),
                        })
                    }
                    None => None,
                };

                // Check if tu_id exists and isn't null
                let active_tool_use = match row.try_get::<Option<String>, _>("tu_id")? {
                    Some(tu_id) => Some(ChatNodeMcpToolUse {
                        id: tu_id,
                        input: row.try_get("tu_input").ok(),
                        output: row.try_get("tu_output").ok(),
                        status: row.get("tu_status"),
                        error: row.try_get("tu_error").ok(),
                        version_number: row.get("tu_version_number"),
                        node_id: row.get("tu_node_id"),
                        tool_id: row.get("tu_tool_id"),
                        created_at: row.try_get("created_at").ok(),
                        updated_at: row.try_get("updated_at").ok(),
                    }),
                    None => None,
                };

                let node = ChatNode {
                    id: row.get("id"),
                    node_type: row.get("node_type"),
                    branch_id: row.get("branch_id"),
                    parent_id: row.try_get("parent_id")?,
                    active_message_id: row.try_get("active_message_id")?,
                    updated_at: row.try_get("updated_at")?,
                    active_message: content_version,
                    message_count: row.try_get("message_count").ok(),
                    extensions: row.try_get("extensions").ok(),
                    active_tool_use_id: row.try_get("active_tool_use_id").ok(),
                    active_tool_use: active_tool_use,
                };

                nodes.push(node);
            }

            // Check if there are more results beyond the requested limit
            let has_more = nodes.len() > 20;

            // Trim to the requested limit
            // if has_more {
            //     nodes.truncate(20);
            // }

            nodes.reverse();

            info!(
                "Found {} chat nodes for branch: {}{}",
                nodes.len(),
                branch_id,
                if has_more { " (has more)" } else { "" }
            );

            return Ok(ChatNodesResponse { nodes, has_more });
        } else {
            // Pagination - get older messages than the cursor
            let node_id = after_node_id.unwrap();

            let query = r#"
                SELECT 
                    chat_nodes.id,
                    chat_nodes.node_type,
                    chat_nodes.branch_id,
                    chat_nodes.parent_id,
                    chat_nodes.active_message_id,
                    chat_nodes.active_tool_use_id,
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
                    tool_use.id as tu_id,
                    tool_use.input as tu_input,
                    tool_use.output as tu_output,
                    tool_use.status as tu_status,
                    tool_use.error as tu_error,
                    tool_use.version_number as tu_version_number,
                    tool_use.node_id as tu_node_id,
                    tool_use.tool_id as tu_tool_id,
                    (SELECT COUNT(*) FROM chat_node_messages WHERE node_id = chat_nodes.id) as message_count
                FROM chat_nodes
                LEFT JOIN chat_node_messages as content_versions ON chat_nodes.active_message_id = content_versions.id
                LEFT JOIN chat_node_mcp_tool_use as tool_use ON chat_nodes.active_tool_use_id = tool_use.id
                WHERE chat_nodes.branch_id = ?
                AND chat_nodes.id < ?
                ORDER BY chat_nodes.id DESC
            "#;

            let rows = sqlx::query(query)
                .bind(branch_id)
                .bind(node_id)
                .fetch_all(self.pool.get())
                .await?;

            // Manually map rows to ChatNode structs
            let mut nodes = Vec::with_capacity(rows.len());
            for row in rows {
                // Check if cv_id exists and isn't null
                let content_version = match row.try_get::<Option<String>, _>("cv_id")? {
                    Some(cv_id) => {
                        let markdown_content: String = row.get("cv_content");
                        // Convert markdown to HTML
                        let html_content = markdown_to_html(&markdown_content);

                        Some(ContentVersion {
                            id: cv_id,
                            content: html_content,
                            version_number: row.get("cv_version_number"),
                            node_id: row.get("cv_node_id"),
                            status: row
                                .try_get("status")
                                .unwrap_or_else(|_| "published".to_string()),
                            token_count: row.try_get("cv_token_count").ok(),
                            cost: row.try_get("cv_cost").ok(),
                            api_metadata: row.try_get("cv_api_metadata").ok(),
                            model_id: row.try_get("cv_model_id").ok(),
                            extensions: row.try_get("cv_extensions").ok(),
                        })
                    }
                    None => None,
                };

                // Check if tu_id exists and isn't null
                let active_tool_use = match row.try_get::<Option<String>, _>("tu_id")? {
                    Some(tu_id) => Some(ChatNodeMcpToolUse {
                        id: tu_id,
                        input: row.try_get("tu_input").ok(),
                        output: row.try_get("tu_output").ok(),
                        status: row.get("tu_status"),
                        error: row.try_get("tu_error").ok(),
                        version_number: row.get("tu_version_number"),
                        node_id: row.get("tu_node_id"),
                        tool_id: row.get("tu_tool_id"),
                        created_at: row.try_get("created_at").ok(),
                        updated_at: row.try_get("updated_at").ok(),
                    }),
                    None => None,
                };

                let node = ChatNode {
                    id: row.get("id"),
                    node_type: row.get("node_type"),
                    branch_id: row.get("branch_id"),
                    parent_id: row.try_get("parent_id")?,
                    active_message_id: row.try_get("active_message_id")?,
                    updated_at: row.try_get("updated_at")?,
                    active_message: content_version,
                    message_count: row.try_get("message_count").ok(),
                    extensions: row.try_get("extensions").ok(),
                    active_tool_use_id: row.try_get("active_tool_use_id").ok(),
                    active_tool_use: active_tool_use,
                };

                nodes.push(node);
            }

            // Check if there are more results beyond the requested limit
            let has_more = nodes.len() > 20;

            // Trim to the requested limit
            // if has_more {
            //     nodes.truncate(20);
            // }

            nodes.reverse();

            info!(
                "Found {} chat nodes for branch: {}{}",
                nodes.len(),
                branch_id,
                if has_more { " (has more)" } else { "" }
            );

            return Ok(ChatNodesResponse { nodes, has_more });
        }
    }

    /// Get all branches for a specific chat
    pub async fn get_branches(&self, chat_id: &str) -> sqlx::Result<Vec<Branch>> {
        info!("Fetching all branches for chat with id: {}", chat_id);

        let branches = sqlx::query_as::<_, Branch>(
            r#"
            SELECT *
            FROM chat_branches
            WHERE chat_id = ?
            ORDER BY updated_at DESC
            "#,
        )
        .bind(chat_id)
        .fetch_all(self.pool.get())
        .await?;

        info!("Found {} branches for chat: {}", branches.len(), chat_id);

        Ok(branches)
    }

    /// Get the model ID for a specific branch
    pub async fn get_branch_model(&self, branch_id: &str) -> sqlx::Result<Option<String>> {
        info!("Fetching model ID for branch: {}", branch_id);

        let model_id = sqlx::query!(
            r#"
            SELECT model_id
            FROM chat_branches
            WHERE id = ?
            "#,
            branch_id
        )
        .fetch_optional(self.pool.get())
        .await?
        .map(|record| record.model_id)
        .flatten(); // Convert Option<Option<String>> to Option<String>

        info!(
            "Model ID for branch {}: {}",
            branch_id,
            model_id.as_deref().unwrap_or("not set")
        );

        Ok(model_id)
    }

    // Additional branch-related methods can be added here
}
