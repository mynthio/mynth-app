use anyhow::Error;
use reqwest::Client;
use tracing::debug;

use super::dtos::{MarketplaceApiProvider, MarketplaceApiProviderIntegration};

pub struct MarketplaceApiService {
    client: Client,
}

impl MarketplaceApiService {
    pub fn new() -> Self {
        let client = Client::builder().build().expect("Failed to create client");

        Self { client }
    }

    pub async fn fetch_provider(
        &self,
        provider_id: String,
    ) -> Result<MarketplaceApiProvider, Error> {
        let response = self
            .client
            .get(format!(
                "http://localhost:3000/0.1/providers/{}",
                provider_id
            ))
            .send()
            .await?;

        Ok(response.json::<MarketplaceApiProvider>().await?)
    }

    // TODO: Move to ProviderSummary type instead of whole Provider type for listings
    pub async fn list_providers(&self) -> Result<Vec<MarketplaceApiProvider>, Error> {
        let response = self
            .client
            .get("http://localhost:3000/0.1/providers")
            .send()
            .await?;

        Ok(response.json::<Vec<MarketplaceApiProvider>>().await?)
    }

    pub async fn fetch_provider_integration(
        &self,
        provider_id: String,
    ) -> Result<MarketplaceApiProviderIntegration, Error> {
        debug!(
            provider_id = provider_id,
            "MarketplaceApiService::fetch_provider_integration"
        );

        let response = self
            .client
            .get(format!(
                "http://localhost:3000/0.1/providers/{}/integration",
                provider_id
            ))
            .send()
            .await?;

        debug!(
            provider_id = provider_id,
            response_status = response.status().as_u16(),
            "MarketplaceApiService::fetch_provider_integration response"
        );

        Ok(response.json::<MarketplaceApiProviderIntegration>().await?)
    }
}
