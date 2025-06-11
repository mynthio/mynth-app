use std::sync::Arc;

use crate::features::{
    node::{
        dtos::{NewNode, UpdateNode},
        repository::NodeRepository,
    },
    node_message::{dtos::NewNodeMessage, repository::NodeMessageRepository},
};

use super::{
    dtos::{Branch, NewBranch},
    repository::BranchRepository,
};
use anyhow::Error;
use sqlx::SqlitePool;
use ulid::{Generator, Ulid};

//
// CONSTANTS
//
const DEFAULT_CHAT_NAME: &str = "New Chat";
const DEFAULT_BRANCH_NAME: &str = "Main";

//
// SERVICE
//
pub struct BranchService {
    db_pool: Arc<SqlitePool>,
}

impl BranchService {
    pub fn new(db_pool: Arc<SqlitePool>) -> Self {
        Self { db_pool }
    }

    pub async fn clone(
        &self,
        branch_id: String,
        after_node_id: Option<String>,
    ) -> Result<Branch, Error> {
        let branch_repository = BranchRepository::new(self.db_pool.clone());
        let branch = branch_repository.get(&branch_id).await?;

        // We need to get nodes to clone for a specific branch.
        // We do not perform a deep clone, so we only clone the active message, which will be returned from this single query.
        let node_repository = NodeRepository::new(self.db_pool.clone());
        let nodes = if let Some(after_node_id) = after_node_id {
            node_repository
                .get_all_by_branch_id_and_after_node_id(&branch_id, &after_node_id)
                .await?
        } else {
            node_repository.get_all_by_branch_id(&branch_id).await?
        };

        let new_branch = NewBranch {
            id: Some(Ulid::new().to_string()),
            chat_id: branch.chat_id,
            model_id: branch.model_id,
            name: "New branch".to_string(),
            parent_id: Some(branch.id.clone()),
        };

        // We need to update the IDs of nodes and node messages in proper order.
        let mut ulid_generator = Generator::new();

        let (new_nodes, new_node_messages): (Vec<NewNode>, Vec<NewNodeMessage>) = nodes
            .iter()
            .map(|node| {
                let new_node = NewNode {
                    id: Some(ulid_generator.generate().unwrap().to_string()),
                    branch_id: new_branch.id.clone().unwrap(),
                    role: node.role.clone(),
                    r#type: node.r#type.clone(),
                    active_message_id: None,
                    active_tool_use_id: None,
                    extensions: None,
                    updated_at: None,
                };

                let new_node_message = NewNodeMessage {
                    id: Some(ulid_generator.generate().unwrap().to_string()),
                    content: node.message_content.clone().unwrap(),
                    model_id: node.message_model_id.clone(),
                    status: "completed".to_string(),
                    node_id: new_node.id.clone().unwrap(),
                    version_number: 0,
                };

                (new_node, new_node_message)
            })
            .unzip();

        let update_nodes: Vec<UpdateNode> = new_node_messages
            .iter()
            .map(|node_message| UpdateNode {
                id: node_message.node_id.clone(),
                active_message_id: Some(node_message.id.clone().unwrap()),
                ..Default::default()
            })
            .collect();

        let node_message_repository = NodeMessageRepository::new(self.db_pool.clone());

        let mut tx = self.db_pool.begin().await?;

        let created_branch = branch_repository
            .create_with_executor(&mut *tx, new_branch)
            .await?;

        node_repository
            .create_many_with_executor(&mut *tx, new_nodes)
            .await?;

        node_message_repository
            .create_many_with_executor(&mut *tx, new_node_messages)
            .await?;

        for update_node in update_nodes {
            node_repository
                .update_with_executor(&mut *tx, update_node)
                .await?;
        }

        tx.commit().await?;

        Ok(created_branch)
    }
}
