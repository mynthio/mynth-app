use serde::{Deserialize, Serialize};
use std::fmt;

/// Represents the type of a chat node
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeType {
    /// A message from a user
    UserMessage,
    /// A response from an assistant
    AssistantMessage,
    /// A note from a user (not included in chat history)
    UserNote,
    /// A note from an assistant (not included in chat history)
    AssistantNote,
}

impl NodeType {
    /// Convert NodeType to its string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            NodeType::UserMessage => "user_message",
            NodeType::AssistantMessage => "assistant_message",
            NodeType::UserNote => "user_note",
            NodeType::AssistantNote => "assistant_note",
        }
    }

    /// Get the corresponding role for AI message formatting
    /// Returns None for note types that shouldn't be included in AI context
    pub fn to_role(&self) -> Option<&'static str> {
        match self {
            NodeType::UserMessage => Some("user"),
            NodeType::AssistantMessage => Some("assistant"),
            NodeType::UserNote | NodeType::AssistantNote => None,
        }
    }
}

impl fmt::Display for NodeType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl From<&str> for NodeType {
    fn from(s: &str) -> Self {
        match s {
            "user_message" => NodeType::UserMessage,
            "assistant_message" => NodeType::AssistantMessage,
            "user_note" => NodeType::UserNote,
            "assistant_note" => NodeType::AssistantNote,
            _ => panic!("Invalid node type: {}", s),
        }
    }
}

impl From<String> for NodeType {
    fn from(s: String) -> Self {
        Self::from(s.as_str())
    }
}
