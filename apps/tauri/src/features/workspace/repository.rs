use std::sync::Arc;

use sqlx::{Sqlite, SqlitePool};

use crate::features::workspace::dtos::WorkspaceSelectConfig;

use super::dtos::{Workspace, WorkspaceConfig, WorkspaceItemContext};

#[derive(Clone)]
pub struct WorkspaceRepository {
    pool: Arc<SqlitePool>,
}

impl WorkspaceRepository {
    /// Create a new workspace service
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    /// Get all workspaces
    pub async fn get_all(&self) -> Result<Vec<Workspace>, sqlx::Error> {
        self.get_all_with_executor(&*self.pool).await
    }

    /// Get all workspaces with a specified executor
    pub async fn get_all_with_executor<'e, E>(
        &self,
        executor: E,
    ) -> Result<Vec<Workspace>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(
            Workspace,
            r#"
            SELECT id, name, context, updated_at
            FROM workspaces
        "#
        )
        .fetch_all(executor)
        .await
    }

    /// Get a workspace by id
    pub async fn get(&self, id: &str) -> Result<Option<Workspace>, sqlx::Error> {
        self.get_with_executor(&*self.pool, id).await
    }

    /// Get a workspace by id with a specified executor
    pub async fn get_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
    ) -> Result<Option<Workspace>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(
            Workspace,
            r#"
        SELECT id, name, context, updated_at
        FROM workspaces
        WHERE id = ?
        "#,
            id
        )
        .fetch_optional(executor)
        .await
    }

    /// Get a workspace config by id
    pub async fn select_config(&self, id: &str) -> Result<WorkspaceConfig, sqlx::Error> {
        self.select_config_with_executor(&*self.pool, id).await
    }

    /// Get a workspace config by id with a specified executor
    pub async fn select_config_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
    ) -> Result<WorkspaceConfig, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(
            WorkspaceSelectConfig,
            r#"SELECT json_config as "json_config: sqlx::types::Json<WorkspaceConfig>" FROM workspaces WHERE id = ?"#,
            id
        )
        .fetch_one(executor)
        .await
        .map(|config| config.json_config.0)
    }

    /// Get the context for a workspace item
    pub async fn get_item_context(
        &self,
        chat_id: &str,
    ) -> Result<WorkspaceItemContext, sqlx::Error> {
        self.get_item_context_with_executor(&*self.pool, chat_id)
            .await
    }

    /// Get the context for a workspace item with a specified executor
    pub async fn get_item_context_with_executor<'e, E>(
        &self,
        executor: E,
        chat_id: &str,
    ) -> Result<WorkspaceItemContext, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as::<_, WorkspaceItemContext>(
            r#"WITH RECURSIVE context_resolution AS (
                    SELECT
                        c.id AS item_id,
                        'chat' AS item_type,
                        c.context AS context,
                        c.context_inheritance_mode AS inheritance_mode,
                        c.parent_id AS parent_folder_id,
                        c.workspace_id AS workspace_id,
                        0 AS depth
                    FROM chats c
                    WHERE c.id = ?

                    UNION ALL

                    SELECT
                        f.id AS item_id,
                        'folder' AS item_type,
                        f.context AS context,
                        f.context_inheritance_mode AS inheritance_mode,
                        f.parent_id AS parent_folder_id,
                        f.workspace_id AS workspace_id,
                        cr.depth + 1 AS depth
                    FROM folders f
                    INNER JOIN context_resolution cr
                        ON cr.inheritance_mode = 'inherit'
                        AND cr.item_type = 'chat' -- Only follow parent_id for chats (since chats point to folders)
                        AND cr.parent_folder_id = f.id
                        AND cr.depth = 0 -- Only recurse from the initial chat

                    UNION ALL

                    SELECT
                        f.id AS item_id,
                        'folder' AS item_type,
                        f.context AS context,
                        f.context_inheritance_mode AS inheritance_mode,
                        f.parent_id AS parent_folder_id,
                        f.workspace_id AS workspace_id,
                        cr.depth + 1 AS depth
                    FROM folders f
                    INNER JOIN context_resolution cr
                        ON cr.inheritance_mode = 'inherit'
                        AND cr.item_type = 'folder'
                        AND cr.parent_folder_id = f.id
                    )
                    SELECT
                    CASE
                        WHEN cr.inheritance_mode = 'workspace' THEN w.context
                        WHEN cr.inheritance_mode IN ('none', 'override') THEN cr.context
                        ELSE COALESCE(cr.context, w.context) -- For 'inherit', use item context if non-null, else workspace context
                    END AS context,
                    CASE
                        WHEN cr.inheritance_mode = 'workspace' THEN 'workspace'
                        ELSE cr.item_type
                    END AS item_type,
                    CASE
                        WHEN cr.inheritance_mode = 'workspace' THEN w.id
                        ELSE cr.item_id
                    END AS item_id
                    FROM context_resolution cr
                    LEFT JOIN workspaces w ON cr.workspace_id = w.id
                    WHERE cr.inheritance_mode IN ('none', 'override', 'workspace')
                    OR (cr.inheritance_mode = 'inherit' AND cr.context IS NOT NULL)
                    OR (cr.inheritance_mode = 'inherit' AND cr.parent_folder_id IS NULL)
                    LIMIT 1"#,
        )
        .bind(chat_id)
        .fetch_one(executor)
        .await
    }
}
