use futures::try_join;
use sqlx::QueryBuilder;
use sqlx::Row;
use sqlx::Sqlite;
use std::sync::Arc;
use tracing::{error, info};

use super::chat_folder::ChatFolderService;
use super::database::DbPool;
use crate::models::chat::{
    Chat, ChatListItem, ChatNode, ChatNodesResponse, ContentVersion, UpdateChatParams,
};
use crate::utils::markdown::markdown_to_html;

pub struct ChatService {
    pool: Arc<DbPool>,
    folders: ChatFolderService,
}

impl ChatService {
    pub fn new(pool: Arc<DbPool>, folders: &ChatFolderService) -> Self {
        let pool_clone = Arc::clone(&pool);
        Self {
            pool,
            folders: ChatFolderService::new(pool_clone),
        }
    }

    pub async fn get_chats(
        &self,
        workspace_id: String,
        parent_id: Option<String>,
    ) -> sqlx::Result<Vec<ChatListItem>> {
        // Build query based on parent_id parameter
        if let Some(parent) = &parent_id {
            // If parent_id is provided (could be null or a specific ID)
            sqlx::query_as!(
                ChatListItem,
                r#"
                SELECT id, name, parent_id, workspace_id, updated_at 
                FROM chats 
                WHERE workspace_id = ? AND 
                      ((?2 IS NULL AND parent_id IS NULL) OR parent_id = ?2)
                ORDER BY updated_at DESC
                "#,
                workspace_id,
                parent
            )
            .fetch_all(self.pool.get())
            .await
        } else {
            // If parent_id is not provided at all, don't filter by parent
            sqlx::query_as!(
                ChatListItem,
                r#"
                SELECT id, name, parent_id, workspace_id, updated_at 
                FROM chats 
                WHERE workspace_id = ?
                ORDER BY updated_at DESC
                "#,
                workspace_id
            )
            .fetch_all(self.pool.get())
            .await
        }
    }

    pub async fn get_chat(&self, chat_id: &str) -> sqlx::Result<Option<Chat>> {
        info!("Fetching chat with id: {}", chat_id);

        let chat = sqlx::query_as!(
            Chat,
            r#"
            SELECT id, name, parent_id, workspace_id, current_branch_id, 
                   is_archived, archived_at, created_at, updated_at
            FROM chats
            WHERE id = ?
            "#,
            chat_id
        )
        .fetch_optional(self.pool.get())
        .await?;

        info!(
            "Chat fetch result for id {}: {}",
            chat_id,
            if chat.is_some() { "found" } else { "not found" }
        );
        Ok(chat)
    }

    pub async fn update_chat(&self, chat_id: &str, params: UpdateChatParams) -> sqlx::Result<()> {
        info!("Updating chat with id: {}", chat_id);

        let mut updates = Vec::new();
        let mut binds = Vec::new();

        if let Some(name) = &params.name {
            updates.push("name = ?");
            binds.push(name.as_str());
        }

        if let Some(parent_id) = &params.parent_id {
            updates.push("parent_id = ?");
            binds.push(parent_id.as_str());
        }

        if let Some(workspace_id) = &params.workspace_id {
            updates.push("workspace_id = ?");
            binds.push(workspace_id.as_str());
        }

        if let Some(current_branch_id) = &params.current_branch_id {
            updates.push("current_branch_id = ?");
            binds.push(current_branch_id.as_str());
        }

        if let Some(is_archived) = params.is_archived {
            updates.push("is_archived = ?");
            binds.push(if is_archived { "1" } else { "0" });

            // Automatically set archived_at based on is_archived value
            if is_archived {
                // When archiving, set archived_at to current time
                updates.push("archived_at = datetime('now')");
            } else {
                // When unarchiving, set archived_at to NULL
                updates.push("archived_at = NULL");
            }
        }

        if updates.is_empty() {
            info!("No chat updates provided, skipping update");
            return Ok(());
        }

        let updates_str = updates.join(", ");
        let query = format!(
            r#"
            UPDATE chats
            SET {updates_str}, updated_at = datetime('now')
            WHERE id = ?
            "#
        );

        let mut query = sqlx::query(&query);
        for bind in binds {
            query = query.bind(bind);
        }
        query = query.bind(chat_id);

        query.execute(self.pool.get()).await?;

        Ok(())
    }

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
}
