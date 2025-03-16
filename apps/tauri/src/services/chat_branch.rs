use super::database::DbPool;
use crate::models::chat::ChatNode;
use crate::models::chat::ChatNodesResponse;
use crate::models::chat::ContentVersion;
use crate::models::chat_branch::Branch;
use crate::utils::markdown::markdown_to_html;
use sqlx::Row;
use std::sync::Arc;
use tracing::info;

/// Service for handling chat branch operations
pub struct ChatBranchService {
    pool: Arc<DbPool>,
}

impl ChatBranchService {
    /// Create a new chat branch service
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
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

        // First, check if we need the cursor condition
        let cursor_condition = if let Some(node_id) = after_node_id {
            // We need to get the created_at timestamp for the cursor node to use for comparison
            let cursor_timestamp = sqlx::query!(
                r#"
                SELECT created_at FROM chat_nodes
                WHERE id = ?
                "#,
                node_id
            )
            .fetch_optional(self.pool.get())
            .await?
            .and_then(|row| row.created_at)
            .unwrap_or_else(|| {
                // If node not found or has no timestamp, use current time as fallback
                // (effectively returning no results, which is expected behavior)
                chrono::Utc::now().naive_utc()
            });

            format!("AND chat_nodes.created_at < '{}'", cursor_timestamp)
        } else {
            String::new()
        };

        // Build and execute the query with pagination
        let query = format!(
            r#"
            SELECT 
                chat_nodes.id,
                chat_nodes.node_type,
                chat_nodes.branch_id,
                chat_nodes.parent_id,
                chat_nodes.model_id,
                chat_nodes.active_version_id,
                chat_nodes.created_at,
                chat_nodes.updated_at,
                content_versions.id as cv_id,
                content_versions.content as cv_content,
                content_versions.version_number as cv_version_number,
                content_versions.node_id as cv_node_id,
                content_versions.created_at as cv_created_at
            FROM chat_nodes
            LEFT JOIN chat_node_content_versions as content_versions ON chat_nodes.active_version_id = content_versions.id
            WHERE chat_nodes.branch_id = ?
            {}
            ORDER BY chat_nodes.created_at DESC
            LIMIT 21
            "#,
            cursor_condition
        );

        // Use row mapping instead of query_as
        let rows = sqlx::query(&query)
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
                        created_at: row.try_get("cv_created_at")?,
                    })
                }
                None => None,
            };

            let node = ChatNode {
                id: row.get("id"),
                node_type: row.get("node_type"),
                branch_id: row.get("branch_id"),
                parent_id: row.try_get("parent_id")?,
                model_id: row.try_get("model_id")?,
                active_version_id: row.try_get("active_version_id")?,
                created_at: row.try_get("created_at")?,
                updated_at: row.try_get("updated_at")?,
                active_version: content_version,
            };

            nodes.push(node);
        }

        // Check if there are more results beyond the requested limit
        let has_more = nodes.len() > 20;

        // Trim to the requested limit
        if has_more {
            nodes.truncate(20);
        }

        info!(
            "Found {} chat nodes for branch: {}{}",
            nodes.len(),
            branch_id,
            if has_more { " (has more)" } else { "" }
        );

        Ok(ChatNodesResponse { nodes, has_more })
    }

    /// Get all branches for a specific chat
    pub async fn get_branches(&self, chat_id: &str) -> sqlx::Result<Vec<Branch>> {
        info!("Fetching all branches for chat with id: {}", chat_id);

        let branches = sqlx::query_as::<_, Branch>(
            r#"
            SELECT *
            FROM chat_branches
            WHERE chat_id = ?
            ORDER BY created_at DESC
            "#,
        )
        .bind(chat_id)
        .fetch_all(self.pool.get())
        .await?;

        info!("Found {} branches for chat: {}", branches.len(), chat_id);

        Ok(branches)
    }

    // Additional branch-related methods can be added here
}
