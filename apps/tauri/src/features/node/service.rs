use std::{sync::Arc, time::Instant};

use anyhow::Result;
use sqlx::SqlitePool;
use tracing::debug;
use ulid::Generator;

use crate::{
    features::node_message::{dtos::NewNodeMessage, repository::NodeMessageRepository},
    utils::markdown::markdown_to_html,
};

use super::{
    dtos::{NewChatPair, NewNode, Node, NodeRole, NodeType, UpdateNode},
    repository::NodeRepository,
};

//
// SERVICE
//
pub struct NodeService {
    repository: NodeRepository,
}

impl NodeService {
    pub fn new(repository: NodeRepository) -> Self {
        Self { repository }
    }

    pub async fn create_chat_pair(
        &self,
        pool: Arc<SqlitePool>,
        node_message_repository: NodeMessageRepository,
        branch_id: String,
        chat_pair: NewChatPair,
    ) -> Result<(String, String, String, String)> {
        debug!("NodeService::create_chat_pair");
        let start = Instant::now();

        let mut ulid_generator = Generator::new();

        let user_node_id = ulid_generator.generate().unwrap().to_string();
        let user_node_message_id = ulid_generator.generate().unwrap().to_string();
        let assistant_node_id = ulid_generator.generate().unwrap().to_string();
        let assistant_node_message_id = ulid_generator.generate().unwrap().to_string();
        let user_node = NewNode {
            id: Some(user_node_id.clone()),
            branch_id: branch_id.clone(),
            r#type: NodeType::Message,
            role: NodeRole::User,
            active_message_id: None,
            active_tool_use_id: None,
            extensions: None,
            updated_at: None,
        };

        let user_node_message = NewNodeMessage {
            id: Some(user_node_message_id.clone()),
            node_id: user_node_id.clone(),
            content: chat_pair.user_node.content,
            status: "TODO".to_string(),
            version_number: 0,
            model_id: None,
        };

        let assistant_node = NewNode {
            id: Some(assistant_node_id.clone()),
            branch_id: branch_id.clone(),
            r#type: NodeType::Message,
            role: NodeRole::Assistant,
            active_message_id: None,
            active_tool_use_id: None,
            extensions: None,
            updated_at: None,
        };

        let assistant_node_message = NewNodeMessage {
            id: Some(assistant_node_message_id.clone()),
            node_id: assistant_node_id.clone(),
            content: chat_pair.assistant_node.content,
            status: "TODO".to_string(),
            version_number: 0,
            model_id: Some(chat_pair.assistant_node.model_id),
        };

        let mut tx = pool.begin().await?;

        self.repository
            .create_many_with_executor(&mut *tx, vec![user_node, assistant_node])
            .await?;

        node_message_repository
            .create_many_with_executor(&mut *tx, vec![user_node_message, assistant_node_message])
            .await?;

        self.repository
            .update_with_executor(
                &mut *tx,
                UpdateNode {
                    id: user_node_id.clone(),
                    active_message_id: Some(user_node_message_id.clone()),
                    active_tool_use_id: None,
                    extensions: None,
                    r#type: None,
                    role: None,
                    branch_id: None,
                },
            )
            .await?;

        self.repository
            .update_with_executor(
                &mut *tx,
                UpdateNode {
                    id: assistant_node_id.clone(),
                    active_message_id: Some(assistant_node_message_id.clone()),
                    active_tool_use_id: None,
                    extensions: None,
                    r#type: None,
                    role: None,
                    branch_id: None,
                },
            )
            .await?;

        tx.commit().await?;

        let duration = start.elapsed();
        debug!("NodeService::create_chat_pair took {:?}", duration);

        Ok((
            user_node_id,
            assistant_node_id,
            user_node_message_id,
            assistant_node_message_id,
        ))
    }

    pub async fn format_nodes(nodes: Vec<Node>) -> Result<Vec<Node>> {
        // Map nodes, formatting the message content from markdown to HTML
        // This converts any markdown in the message_content field to properly rendered HTML
        let formatted_nodes = nodes
            .into_iter()
            .map(|mut node| {
                // Only format if message_content exists and is not empty
                if let Some(content) = &node.message_content {
                    if !content.trim().is_empty() {
                        node.message_content = Some(markdown_to_html(content));
                    }
                }
                node
            })
            .collect();

        Ok(formatted_nodes)
    }
}
