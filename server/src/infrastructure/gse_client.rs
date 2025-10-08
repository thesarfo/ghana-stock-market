use crate::domain::{Equity, EquityLive, EquitySummary, GseApiClient};
use anyhow::{Context, Result};
use reqwest::Client;
use std::time::Duration;
use tokio::time::sleep;

/// GSE API client implementation
pub struct GseApiClientImpl {
    client: Client,
    base_url: String,
}

impl GseApiClientImpl {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            base_url: "https://dev.kwayisi.org/apis/gse".to_string(),
        }
    }

    /// Helper method to make HTTP requests with rate limiting
    async fn make_request<T>(&self, url: &str) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        // Rate limiting: max 60 requests per second as per API docs
        sleep(Duration::from_millis(100)).await; // ~10 requests per second for safety

        let response = self
            .client
            .get(url)
            .send()
            .await
            .context("Failed to send request")?;

        if !response.status().is_success() {
            anyhow::bail!("API request failed with status: {}", response.status());
        }

        let data = response
            .json::<T>()
            .await
            .context("Failed to parse JSON response")?;

        Ok(data)
    }

    /// Retry logic with exponential backoff
    async fn make_request_with_retry<T>(&self, url: &str, max_retries: u32) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        let mut retries = 0;
        let mut delay = Duration::from_secs(1);

        loop {
            match self.make_request(url).await {
                Ok(data) => return Ok(data),
                Err(e) if retries >= max_retries => return Err(e),
                Err(e) => {
                    tracing::warn!("Request failed (attempt {}): {}", retries + 1, e);
                    sleep(delay).await;
                    delay *= 2; // Exponential backoff
                    retries += 1;
                }
            }
        }
    }
}

#[async_trait::async_trait]
impl GseApiClient for GseApiClientImpl {
    async fn fetch_all_live_data(&self) -> Result<Vec<EquityLive>> {
        let url = format!("{}/live", self.base_url);
        self.make_request_with_retry(&url, 3).await
    }

    async fn fetch_all_equities(&self) -> Result<Vec<EquitySummary>> {
        let url = format!("{}/equities", self.base_url);
        self.make_request_with_retry(&url, 3).await
    }

    async fn fetch_equity_data(&self, symbol: &str) -> Result<Equity> {
        let url = format!("{}/equities/{}", self.base_url, symbol.to_lowercase());
        self.make_request_with_retry(&url, 3).await
    }
}
