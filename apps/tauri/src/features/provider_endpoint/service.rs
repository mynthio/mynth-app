use std::time::Instant;

use bytes::Bytes;
use futures::stream::Stream;
use minijinja::Environment;
use reqwest::Client;
use reqwest::Error;
use std::pin::Pin;
use tracing::debug;

use super::{dtos::ProviderEndpointCallChatData, repository::ProviderEndpointRepository};

//
// SERVICE
//
pub struct ProviderEndpointService {
    provider_endpoint_repository: ProviderEndpointRepository,
    client: Client,
}

impl ProviderEndpointService {
    pub fn new(provider_endpoint_repository: ProviderEndpointRepository) -> Self {
        let client = Client::builder()
            .build()
            .expect("Failed to build reqwest client");

        Self {
            provider_endpoint_repository,
            client,
        }
    }

    pub async fn call_chat(
        &self,
        provider_endpoint_id: &str,
        data: ProviderEndpointCallChatData,
    ) -> anyhow::Result<String> {
        let start = Instant::now();

        let mut env = Environment::new();
        env.add_template("template", r#"{ "messages": [ {%- for message in messages %} { "role": "{{ message.role }}", "content": {{ message.content|tojson }} }{% if not loop.last %},{% endif %} {%- endfor %} ], "model": "{{ provider_model_name }}", "max_tokens": 2048, "temperature": 0.7, "top_p": 0.9 }"#).unwrap();
        let template = env.get_template("template").unwrap();
        let duration = start.elapsed();

        debug!(
            duration = ?duration,
            rendered = template.render(data).unwrap().as_str(),
            "Rendered provider endpoint call chat template"
        );

        Ok("lalala".to_string())
    }

    // It should return a stream
    pub async fn stream(
        &self,
        endpoint_id: &str,
        request_body: String,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<Bytes, Error>> + Send>>, Error> {
        let response = self
            .client
            .post(format!("http://localhost:11434/api/chat"))
            .header("Content-Type", "application/json")
            .body(request_body)
            .send()
            .await?;

        Ok(Box::pin(response.bytes_stream()))
    }
}
