use crate::domain::{
    Equity, EquityLive, GseApiClient, MarketSummary, StockRepository, TimeSeriesPoint,
};
use anyhow::Result;
use chrono::{DateTime, Utc};
use std::sync::Arc;

/// Use case for fetching and storing stock data
#[derive(Clone)]
pub struct FetchStockDataUseCase {
    api_client: Arc<dyn GseApiClient + Send + Sync>,
    repository: Arc<dyn StockRepository + Send + Sync>,
}

impl FetchStockDataUseCase {
    pub fn new(
        api_client: Arc<dyn GseApiClient + Send + Sync>,
        repository: Arc<dyn StockRepository + Send + Sync>,
    ) -> Self {
        Self {
            api_client,
            repository,
        }
    }

    /// Fetch all live data from GSE API and store it
    pub async fn fetch_and_store_all_live_data(&self) -> Result<()> {
        let live_data = self.api_client.fetch_all_live_data().await?;
        let count = live_data.len();
        let timestamp = Utc::now();

        for data in live_data {
            self.repository
                .store_live_data(&data.name, &data, timestamp)
                .await?;
        }

        tracing::info!(
            "Successfully fetched and stored {} live data records",
            count
        );
        Ok(())
    }

    pub async fn fetch_and_store_all_equity_data(&self) -> Result<()> {
        let equity_summaries = self.api_client.fetch_all_equities().await?;
        let count = equity_summaries.len();
        let timestamp = Utc::now();

        // For each summary, fetch the detailed equity data
        for summary in equity_summaries {
            match self.api_client.fetch_equity_data(&summary.name).await {
                Ok(equity) => {
                    self.repository
                        .store_equity_data(&equity.name, &equity, timestamp)
                        .await?;
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch detailed data for {}: {}", summary.name, e);
                }
            }
        }

        tracing::info!("Successfully processed {} equity records", count);
        Ok(())
    }

    /// Generate and store market summary
    pub async fn generate_and_store_market_summary(&self) -> Result<()> {
        let all_symbols = self.repository.get_all_symbols().await?;
        let count = all_symbols.len();
        let mut total_market_cap = 0.0;
        let mut total_volume = 0i64;
        let mut top_gainers = Vec::new();
        let mut top_losers = Vec::new();

        for symbol in all_symbols {
            if let Some(live_data) = self.repository.get_latest_live_data(&symbol).await? {
                total_volume += live_data.volume;

                // Try to calculate market cap if we have equity data
                if let Ok(Some(equity)) = self.repository.get_latest_equity_data(&symbol).await {
                    if let Some(shares) = equity.shares {
                        let market_cap = live_data.price * shares as f64;
                        total_market_cap += market_cap;
                    }
                }

                // Categorize as gainer or loser
                if live_data.change > 0.0 {
                    top_gainers.push(live_data);
                } else if live_data.change < 0.0 {
                    top_losers.push(live_data);
                }
            }
        }

        // Sort and take top 5
        top_gainers.sort_by(|a, b| b.change.partial_cmp(&a.change).unwrap());
        top_losers.sort_by(|a, b| a.change.partial_cmp(&b.change).unwrap());
        top_gainers.truncate(5);
        top_losers.truncate(5);

        let summary = MarketSummary {
            total_market_cap,
            total_volume,
            total_stocks: count,
            top_gainers,
            top_losers,
            last_updated: Utc::now(),
        };

        self.repository
            .store_market_summary(&summary, Utc::now())
            .await?;

        tracing::info!(
            "Successfully generated and stored market summary (market cap: {:.2})",
            total_market_cap
        );
        Ok(())
    }
}

/// Use case for retrieving stock data
#[derive(Clone)]
pub struct GetStockDataUseCase {
    repository: Arc<dyn StockRepository + Send + Sync>,
    api_client: Arc<dyn GseApiClient + Send + Sync>,
}

impl GetStockDataUseCase {
    pub fn new(
        repository: Arc<dyn StockRepository + Send + Sync>,
        api_client: Arc<dyn GseApiClient + Send + Sync>,
    ) -> Self {
        Self {
            repository,
            api_client,
        }
    }

    /// Get latest live data for all symbols
    pub async fn get_all_latest_live_data(&self) -> Result<Vec<EquityLive>> {
        let symbols = self.repository.get_all_symbols().await?;
        let mut live_data = Vec::new();

        for symbol in symbols {
            if let Some(data) = self.repository.get_latest_live_data(&symbol).await? {
                live_data.push(data);
            }
        }

        Ok(live_data)
    }

    /// Get historical data for a symbol
    pub async fn get_historical_data(
        &self,
        symbol: &str,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
    ) -> Result<Vec<TimeSeriesPoint>> {
        self.repository.get_historical_data(symbol, from, to).await
    }

    /// Get latest market summary
    pub async fn get_latest_market_summary(&self) -> Result<Option<MarketSummary>> {
        self.repository.get_latest_market_summary().await
    }

    /// Get data for a specific symbol
    pub async fn get_symbol_data(
        &self,
        symbol: &str,
    ) -> Result<Option<(Equity, Option<EquityLive>)>> {
        let equity = self.repository.get_latest_equity_data(symbol).await?;
        let live_data = self.repository.get_latest_live_data(symbol).await?;

        if let Some(equity) = equity {
            Ok(Some((equity, live_data)))
        } else {
            Ok(None)
        }
    }

    /// Get latest live data for a specific symbol
    pub async fn get_latest_live_data(&self, symbol: &str) -> Result<Option<EquityLive>> {
        self.repository.get_latest_live_data(symbol).await
    }

    /// Fetch fresh equity data from API (on-demand)
    pub async fn fetch_fresh_equity_data(&self, symbol: &str) -> Result<Equity> {
        tracing::info!("Fetching fresh equity data for symbol: {}", symbol);
        let equity = self.api_client.fetch_equity_data(symbol).await?;

        tracing::info!(
            "Received equity data for: {} (company: {})",
            equity.name,
            equity.company.name
        );

        // Store it for future use
        let timestamp = Utc::now();
        self.repository
            .store_equity_data(&equity.name, &equity, timestamp)
            .await?;

        tracing::info!("Stored equity data for: {}", equity.name);

        Ok(equity)
    }
}
