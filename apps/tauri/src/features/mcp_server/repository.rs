use std::sync::Arc;

use chrono::Utc;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use tracing::debug;
use ulid::{Generator, Ulid};

use super::dtos::McpServer;

const BIND_LIMIT: usize = 32766;

#[derive(Clone)]
pub struct McpServerRepository {
    pool: Arc<SqlitePool>,
}

impl McpServerRepository {
    /// Create a new MCP server repository
    pub fn new(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub async fn get(&self, id: &str) -> Result<McpServer, sqlx::Error> {
        self.get_with_executor(&*self.pool, id).await
    }

    pub async fn get_with_executor<'e, E>(
        &self,
        executor: E,
        id: &str,
    ) -> Result<McpServer, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let mcp_server =
            sqlx::query_as!(McpServer, r#"SELECT * FROM mcp_servers WHERE id = $1"#, id)
                .fetch_one(executor)
                .await?;

        Ok(mcp_server)
    }

    pub async fn find_all(&self) -> Result<Vec<McpServer>, sqlx::Error> {
        self.find_all_with_executor(&*self.pool).await
    }

    pub async fn find_all_with_executor<'e, E>(
        &self,
        executor: E,
    ) -> Result<Vec<McpServer>, sqlx::Error>
    where
        E: sqlx::Executor<'e, Database = Sqlite>,
    {
        let mcp_servers = sqlx::query_as!(McpServer, r#"SELECT * FROM mcp_servers"#)
            .fetch_all(executor)
            .await?;

        Ok(mcp_servers)
    }
}
