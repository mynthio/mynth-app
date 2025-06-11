use std::sync::Arc;

use chrono::Utc;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::{Generator, Ulid};

use super::dtos::{ActiveTool, Tool};

#[derive(Clone)]
pub struct ToolsRepository {
    pool: Arc<SqlitePool>,
}

impl ToolsRepository {
    /// Create a new tools repository
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn find_by_name(&self, name: &str) -> Result<Option<Tool>, sqlx::Error> {
        self.find_by_name_with_executor(&*self.pool, name).await
    }

    pub async fn find_by_name_with_executor<'e, E>(
        &self,
        executor: E,
        name: &str,
    ) -> Result<Option<Tool>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        sqlx::query_as!(Tool, "SELECT * FROM tools WHERE name = ?", name)
            .fetch_optional(executor)
            .await
    }

    pub async fn find_all_active_by_chat_id(
        &self,
        chat_id: &str,
    ) -> Result<Vec<ActiveTool>, sqlx::Error> {
        self.find_all_active_by_chat_id_with_executor(&*self.pool, chat_id)
            .await
    }

    pub async fn find_all_active_by_chat_id_with_executor<'e, E>(
        &self,
        executor: E,
        chat_id: &str,
    ) -> Result<Vec<ActiveTool>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        // This SQL query is a piece of magic of modern SQLite and everyone should spend a minute to appreciate that someone else wrote it.
        let tools = sqlx::query_as!(
            ActiveTool,
            r#"
              WITH RECURSIVE
                  chat_context (chat_id, folder_id, workspace_id) AS (
                      SELECT
                          id,
                          parent_id,
                          workspace_id
                      FROM
                          chats
                      WHERE
                          id = ?1
                  ),
                  folder_ancestry (folder_id, depth) AS (
                      SELECT
                          f.id,
                          1
                      FROM
                          folders f
                          JOIN chat_context cc ON f.id = cc.folder_id
                      WHERE
                          cc.folder_id IS NOT NULL
                      UNION ALL
                      SELECT
                          f.parent_id,
                          fa.depth + 1
                      FROM
                          folders f
                          JOIN folder_ancestry fa ON f.id = fa.folder_id
                      WHERE
                          f.parent_id IS NOT NULL
                  ),
                  hierarchy_settings (configurable_type, configurable_id, is_enabled, priority) AS (
                      SELECT
                          configurable_type,
                          configurable_id,
                          is_enabled,
                          1
                      FROM
                          tools_settings
                      WHERE
                          entity_type = 'chat'
                          AND entity_id = ?1
                          AND configurable_type = 'tool'
                      UNION ALL
                      SELECT
                          configurable_type,
                          configurable_id,
                          is_enabled,
                          2
                      FROM
                          tools_settings
                      WHERE
                          entity_type = 'chat'
                          AND entity_id = ?1
                          AND configurable_type = 'mcp_server'
                      UNION ALL
                      SELECT
                          s.configurable_type,
                          s.configurable_id,
                          s.is_enabled,
                          10 * fa.depth + (
                              CASE s.configurable_type
                                  WHEN 'tool' THEN 1
                                  ELSE 2
                              END
                          )
                      FROM
                          tools_settings s
                          JOIN folder_ancestry fa ON s.entity_id = fa.folder_id
                      WHERE
                          s.entity_type = 'folder'
                      UNION ALL
                      SELECT
                          configurable_type,
                          configurable_id,
                          is_enabled,
                          1001
                      FROM
                          tools_settings s
                          JOIN chat_context cc ON s.entity_id = cc.workspace_id
                      WHERE
                          s.entity_type = 'workspace'
                          AND configurable_type = 'tool'
                      UNION ALL
                      SELECT
                          configurable_type,
                          configurable_id,
                          is_enabled,
                          1002
                      FROM
                          tools_settings s
                          JOIN chat_context cc ON s.entity_id = cc.workspace_id
                      WHERE
                          s.entity_type = 'workspace'
                          AND configurable_type = 'mcp_server'
                  ),
                  tool_states AS (
                      SELECT
                          t.id AS tool_id,
                          t.name,
                          t.mcp_server_id,
                          s.name AS mcp_server_name,
                          t.input_schema,
                          t.is_enabled_globally AS tool_default,
                          s.is_enabled_globally AS server_default,
                          (
                              SELECT
                                  hs.is_enabled
                              FROM
                                  hierarchy_settings hs
                              WHERE
                                  (
                                      hs.configurable_type = 'tool'
                                      AND hs.configurable_id = t.id
                                  )
                                  OR (
                                      hs.configurable_type = 'mcp_server'
                                      AND hs.configurable_id = t.mcp_server_id
                                  )
                              ORDER BY
                                  hs.priority ASC
                              LIMIT
                                  1
                          ) AS override_state
                      FROM
                          tools t
                          JOIN mcp_servers s ON t.mcp_server_id = s.id
                  )
              SELECT
                  ts.tool_id,
                  ts.name,
                  ts.mcp_server_id,
                  ts.mcp_server_name,
                  ts.input_schema
              FROM
                  tool_states ts
              WHERE
                  COALESCE(ts.override_state, ts.tool_default, ts.server_default, FALSE) = TRUE
            "#,
            chat_id
        )
        .fetch_all(executor)
        .await?;

        Ok(tools)
    }
}
