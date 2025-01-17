use super::chat_folders::ChatFoldersService;
use crate::models::ai::{
    AiIntegration, AiIntegrationWithModels, AiModel, CreateAiIntegrationParams, CreateAiModelParams,
};
use crate::models::chat::{ChatFolder, ChatListItem, FlatItem};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::collections::HashMap;
use uuid::Uuid;

pub struct Database {
    pool: Pool<Sqlite>,
    pub folders: ChatFoldersService,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new().connect(database_url).await?;
        let folders = ChatFoldersService::new(pool.clone());

        Ok(Self { pool, folders })
    }

    pub async fn fetch_chats(&self) -> Result<Vec<ChatListItem>, sqlx::Error> {
        sqlx::query_as!(
            ChatListItem,
            "SELECT id, name, parent_id, updated_at FROM chats ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn fetch_flat_structure(&self) -> Result<Vec<FlatItem>, sqlx::Error> {
        let folders = self.folders.fetch_all().await?;
        let chats = self.fetch_chats().await?;

        let mut items = Vec::new();
        items.extend(folders.into_iter().map(FlatItem::Folder));
        items.extend(chats.into_iter().map(FlatItem::Chat));

        Ok(items)
    }

    pub async fn update_chat_name(&self, chat_id: &str, new_name: String) -> sqlx::Result<()> {
        sqlx::query!("UPDATE chats SET name = ? WHERE id = ?", new_name, chat_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn create_ai_integration(
        &self,
        params: CreateAiIntegrationParams,
    ) -> Result<String, sqlx::Error> {
        let id = format!("ai-{}", Uuid::new_v4());
        sqlx::query!(
            r#"
            INSERT INTO ai_integrations (id, name, base_host, base_path, api_key)
            VALUES (?, ?, ?, ?, ?)
            "#,
            id,
            params.name,
            params.base_host,
            params.base_path,
            params.api_key
        )
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn create_ai_model(
        &self,
        params: CreateAiModelParams,
    ) -> Result<String, sqlx::Error> {
        let id = format!("model-{}", Uuid::new_v4());
        sqlx::query!(
            r#"
            INSERT INTO ai_models (id, model_id, mynth_model_id, integration_id)
            VALUES (?, ?, ?, ?)
            "#,
            id,
            params.model_id,
            params.mynth_model_id,
            params.integration_id,
        )
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    pub async fn fetch_ai_integrations_with_models(
        &self,
    ) -> Result<Vec<AiIntegrationWithModels>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                i.id, i.name, i.base_host, i.base_path, i.api_key,
                m.id as model_id_pk, m.model_id, m.mynth_model_id, m.integration_id
            FROM ai_integrations i
            LEFT JOIN ai_models m ON m.integration_id = i.id
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        let mut integrations_map: std::collections::HashMap<String, AiIntegrationWithModels> =
            HashMap::new();

        for row in rows {
            let integration =
                integrations_map
                    .entry(row.id.clone())
                    .or_insert_with(|| AiIntegrationWithModels {
                        id: row.id,
                        name: row.name,
                        base_host: row.base_host,
                        base_path: row.base_path,
                        api_key: row.api_key.unwrap(),
                        models: Vec::new(),
                    });

            if let Some(model_id_pk) = row.model_id_pk {
                integration.models.push(AiModel {
                    id: model_id_pk,
                    model_id: row.model_id.unwrap(),
                    mynth_model_id: row.mynth_model_id,
                    integration_id: row.integration_id.unwrap(),
                });
            }
        }

        Ok(integrations_map.into_values().collect())
    }
}
