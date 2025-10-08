use crate::domain::entities::*;
use anyhow::Result;
use chrono::{DateTime, Utc};

/// Repository trait for stock data operations
#[async_trait::async_trait]
pub trait StockRepository {
    /// Store live equity data for a specific timestamp
    async fn store_live_data(
        &self,
        symbol: &str,
        data: &EquityLive,
        timestamp: DateTime<Utc>,
    ) -> Result<()>;

    /// Store detailed equity data for a specific timestamp
    async fn store_equity_data(
        &self,
        symbol: &str,
        data: &Equity,
        timestamp: DateTime<Utc>,
    ) -> Result<()>;

    /// Get the latest live data for a symbol
    async fn get_latest_live_data(&self, symbol: &str) -> Result<Option<EquityLive>>;

    /// Get the latest equity data for a symbol
    async fn get_latest_equity_data(&self, symbol: &str) -> Result<Option<Equity>>;

    /// Get all available symbols
    async fn get_all_symbols(&self) -> Result<Vec<String>>;

    /// Get historical data for a symbol within a time range
    async fn get_historical_data(
        &self,
        symbol: &str,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
    ) -> Result<Vec<TimeSeriesPoint>>;

    /// Store market summary data
    async fn store_market_summary(
        &self,
        summary: &MarketSummary,
        timestamp: DateTime<Utc>,
    ) -> Result<()>;

    /// Get the latest market summary
    async fn get_latest_market_summary(&self) -> Result<Option<MarketSummary>>;
}

/// Repository trait for GSE API operations
#[async_trait::async_trait]
pub trait GseApiClient {
    /// Fetch live data for all stocks
    async fn fetch_all_live_data(&self) -> Result<Vec<EquityLive>>;

    /// Fetch all equity summaries
    async fn fetch_all_equities(&self) -> Result<Vec<crate::domain::EquitySummary>>;

    /// Fetch detailed equity data for a specific symbol
    async fn fetch_equity_data(&self, symbol: &str) -> Result<Equity>;
}
