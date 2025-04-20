use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum MessageEvent {
    #[serde(rename_all = "camelCase")]
    MessageReceived {
        message: String,
        node_id: String,
        message_id: String,
    },

    #[serde(rename_all = "camelCase")]
    GenerationComplete { node_id: String },
}
