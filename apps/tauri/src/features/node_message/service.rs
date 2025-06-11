use std::sync::Arc;

use anyhow::Result;
use sqlx::SqlitePool;
use ulid::Generator;

use crate::{features::node_message::dtos::NodeMessage, utils::markdown::markdown_to_html};

use super::{dtos::NewNodeMessage, repository::NodeMessageRepository};

//
// SERVICE
//
pub struct NodeMessageService {
    db_pool: Arc<SqlitePool>,
}

impl NodeMessageService {
    pub fn new(db_pool: Arc<SqlitePool>) -> Self {
        Self { db_pool }
    }

    pub async fn format(node_messages: Vec<NodeMessage>) -> Result<Vec<NodeMessage>> {
        Ok(node_messages
            .into_iter()
            .map(|mut node_message| {
                node_message.content = markdown_to_html(&node_message.content);
                node_message
            })
            .collect())
    }
}
