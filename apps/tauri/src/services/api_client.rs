use reqwest::Error;
use serde::Deserialize;
use serde::Serialize;

// Assuming the dummy API runs on localhost:3000
const BASE_URL: &str = "http://localhost:3000/0.1";

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Provider {
    pub id: String,
    pub maintained_by: String,
    pub is_official: bool,
    pub host: String,
    pub provider_name: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all(serialize = "camelCase", deserialize = "snake_case"))]
pub struct Model {
    pub id: String,
    pub provider_model_id: String,
    pub display_name: String,
    pub description: String,
    pub context_length: u32,
    pub family: String,
    pub created_by: String,
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
