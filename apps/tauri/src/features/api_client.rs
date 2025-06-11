use reqwest::Error;
use serde::Deserialize;
use serde::Serialize;

// Assuming the dummy API runs on localhost:3000
const BASE_URL: &str = "http://localhost:3000/0.1";

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct ProviderMetadata {
    pub description: String,
    // Use Option for potentially null fields
    pub website_url: Option<String>,
    pub github_url: Option<String>,
    // Assuming maintainers is a list of strings, adjust if needed
    pub maintainers: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Provider {
    pub id: String,
    pub is_official: bool,
    pub host: String,
    pub display_name: String,
    pub base_path: Option<String>,
    pub chat_completion_path: Option<String>,
    // Embed the metadata struct
    pub metadata: ProviderMetadata,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct ModelMetadata {
    pub description: Option<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Model {
    pub id: String,
    // Renamed from provider_model_id to match API
    pub model_id: String,
    pub display_name: String,
    // Renamed from context_length
    pub max_context_size: Option<u32>,
    // Embed the metadata struct
    pub metadata: ModelMetadata,
}

pub async fn get_providers() -> Result<Vec<Provider>, Error> {
    let url = format!("{}/providers", BASE_URL);
    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    response.json::<Vec<Provider>>().await
}

pub async fn get_provider_models(provider_id: &str) -> Result<Vec<Model>, Error> {
    // Note: The provider_id in the dummy API path doesn't seem to be URL encoded friendly,
    // it contains '.' which might need specific handling depending on the router.
    // Assuming direct substitution works for the dummy API.
    let url = format!("{}/providers/{}/models", BASE_URL, provider_id);
    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    response.json::<Vec<Model>>().await
}
