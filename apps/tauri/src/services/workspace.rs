use super::database::DbPool;
use crate::models::workspace::Workspace;
use std::sync::Arc;
use tracing::{debug, instrument};
use uuid::Uuid;

#[derive(Debug)]
#[allow(dead_code)]
pub struct CreateWorkspaceParams {
    pub name: String,
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct UpdateWorkspaceParams {
    pub name: Option<String>,
}

pub struct WorkspaceService {
    pool: Arc<DbPool>,
}

impl WorkspaceService {
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }

    /// Gets a workspace by its unique ID
    ///
    /// # Arguments
    /// * `id` - The unique identifier of the workspace to retrieve
    ///
    /// # Returns
    /// * `Ok(Some(Workspace))` - If the workspace is found
    /// * `Ok(None)` - If no workspace with the given ID exists
    /// * `Err` - If a database error occurs
    #[instrument(skip(self), fields(workspace_id = %id))]
    pub async fn get_workspace(&self, id: &str) -> sqlx::Result<Option<Workspace>> {
        // Use query_as! for compile-time verification and automatic mapping
        sqlx::query_as!(
            Workspace,
            r#"
            SELECT id, name, created_at, updated_at
            FROM workspaces
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(self.pool.get())
        .await
    }

    /// Fetches all workspaces from the database
    ///
    /// # Returns
    /// * `Ok(Vec<Workspace>)` - A list of all workspaces sorted by name
    /// * `Err` - If a database error occurs
    #[instrument(skip(self))]
    pub async fn get_all_workspaces(&self) -> sqlx::Result<Vec<Workspace>> {
        // 🛸 Fetch all workspaces from our galactic database!
        // Returns a list of all workspace colonies available for human exploration
        debug!("Fetching all workspaces");
        sqlx::query_as!(
            Workspace,
            r#"
            SELECT id, name, created_at, updated_at
            FROM workspaces
            ORDER BY name
            "#
        )
        .fetch_all(self.pool.get())
        .await
    }

    /// Creates a new workspace
    ///
    /// # Arguments
    /// * `params` - The parameters for creating a new workspace
    ///
    /// # Returns
    /// * `Ok(String)` - The ID of the newly created workspace
    /// * `Err` - If a database error occurs
    #[instrument(skip(self), fields(workspace_name = %params.name))]
    pub async fn create_workspace(&self, params: CreateWorkspaceParams) -> sqlx::Result<String> {
        let id = format!("ws-{}", Uuid::new_v4());
        debug!("Creating workspace with ID: {}", id);

        sqlx::query!(
            r#"
            INSERT INTO workspaces (id, name, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
            id,
            params.name
        )
        .execute(self.pool.get())
        .await?;

        Ok(id)
    }

    /// Updates an existing workspace
    ///
    /// # Arguments
    /// * `id` - The ID of the workspace to update
    /// * `params` - The parameters for updating the workspace
    ///
    /// # Returns
    /// * `Ok(bool)` - True if the workspace was updated, false if it doesn't exist
    /// * `Err` - If a database error occurs
    #[instrument(skip(self), fields(workspace_id = %id))]
    pub async fn update_workspace(
        &self,
        id: &str,
        params: UpdateWorkspaceParams,
    ) -> sqlx::Result<bool> {
        if let Some(name) = params.name {
            debug!("Updating workspace {} with new name: {}", id, name);

            let result = sqlx::query!(
                r#"
                UPDATE workspaces
                SET name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                "#,
                name,
                id
            )
            .execute(self.pool.get())
            .await?;

            Ok(result.rows_affected() > 0)
        } else {
            debug!("No updates provided for workspace {}", id);
            Ok(false)
        }
    }

    /// Deletes a workspace by ID
    ///
    /// # Arguments
    /// * `id` - The ID of the workspace to delete
    ///
    /// # Returns
    /// * `Ok(bool)` - True if the workspace was deleted, false if it doesn't exist
    /// * `Err` - If a database error occurs
    #[instrument(skip(self), fields(workspace_id = %id))]
    pub async fn delete_workspace(&self, id: &str) -> sqlx::Result<bool> {
        debug!("Deleting workspace with ID: {}", id);

        let result = sqlx::query!(
            r#"
            DELETE FROM workspaces
            WHERE id = ?
            "#,
            id
        )
        .execute(self.pool.get())
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
