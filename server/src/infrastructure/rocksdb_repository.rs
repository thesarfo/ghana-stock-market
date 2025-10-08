use crate::domain::{Equity, EquityLive, MarketSummary, StockRepository, TimeSeriesPoint};
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use rocksdb::{Options, DB};
use std::path::Path;

/// RocksDB implementation of the StockRepository
pub struct RocksDbStockRepository {
    db: DB,
}

impl RocksDbStockRepository {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        opts.set_compression_type(rocksdb::DBCompressionType::Lz4);

        let db = DB::open(&opts, path).context("Failed to open RocksDB database")?;

        Ok(Self { db })
    }

    /// Generate key for live data storage
    fn live_data_key(symbol: &str, timestamp: &DateTime<Utc>) -> String {
        format!("stock:{}:live:{}", symbol, timestamp.timestamp())
    }

    /// Generate key for equity data storage
    fn equity_data_key(symbol: &str, timestamp: &DateTime<Utc>) -> String {
        format!("stock:{}:detail:{}", symbol, timestamp.timestamp())
    }

    /// Generate key for market summary storage
    fn market_summary_key(timestamp: &DateTime<Utc>) -> String {
        format!("market:summary:{}", timestamp.timestamp())
    }

    /// Generate key for last update timestamp
    fn last_update_key(symbol: &str) -> String {
        format!("metadata:last_updated:{}", symbol)
    }

    /// Get all symbols from the database
    fn get_all_symbols_from_db(&self) -> Result<Vec<String>> {
        let mut symbols = std::collections::HashSet::new();
        let iter = self.db.prefix_iterator("stock:");

        for item in iter {
            let (key, _) = item?;
            let key_str = String::from_utf8_lossy(&key);

            // Parse key format: stock:{symbol}:{type}:{timestamp}
            if let Some(parts) = key_str.split(':').nth(1) {
                symbols.insert(parts.to_string());
            }
        }

        Ok(symbols.into_iter().collect())
    }
}

#[async_trait::async_trait]
impl StockRepository for RocksDbStockRepository {
    async fn store_live_data(
        &self,
        symbol: &str,
        data: &EquityLive,
        timestamp: DateTime<Utc>,
    ) -> Result<()> {
        let key = Self::live_data_key(symbol, &timestamp);
        let value = serde_json::to_vec(data)?;

        self.db
            .put(key.as_bytes(), &value)
            .context("Failed to store live data")?;

        // Update last update timestamp
        let last_update_key = Self::last_update_key(symbol);
        let timestamp_bytes = timestamp.timestamp().to_be_bytes().to_vec();
        self.db
            .put(last_update_key.as_bytes(), &timestamp_bytes)
            .context("Failed to update last update timestamp")?;

        Ok(())
    }

    async fn store_equity_data(
        &self,
        symbol: &str,
        data: &Equity,
        timestamp: DateTime<Utc>,
    ) -> Result<()> {
        let key = Self::equity_data_key(symbol, &timestamp);
        let value = serde_json::to_vec(data)?;

        self.db
            .put(key.as_bytes(), &value)
            .context("Failed to store equity data")?;

        Ok(())
    }

    async fn get_latest_live_data(&self, symbol: &str) -> Result<Option<EquityLive>> {
        let prefix = format!("stock:{}:live:", symbol);
        let iter = self.db.prefix_iterator(&prefix);

        let mut latest_timestamp = 0i64;
        let mut latest_data = None;

        for item in iter {
            let (key, value) = item?;
            let key_str = String::from_utf8_lossy(&key);

            // Extract timestamp from key
            if let Some(timestamp_str) = key_str.split(':').last() {
                if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                    if timestamp > latest_timestamp {
                        latest_timestamp = timestamp;
                        match serde_json::from_slice::<EquityLive>(&value) {
                            Ok(data) => latest_data = Some(data),
                            Err(_) => {
                                // Silently skip incompatible data
                            }
                        }
                    }
                }
            }
        }

        Ok(latest_data)
    }

    async fn get_latest_equity_data(&self, symbol: &str) -> Result<Option<Equity>> {
        let prefix = format!("stock:{}:detail:", symbol);
        let iter = self.db.prefix_iterator(&prefix);

        let mut latest_timestamp = 0i64;
        let mut latest_data = None;

        for item in iter {
            let (key, value) = item?;
            let key_str = String::from_utf8_lossy(&key);

            // Extract timestamp from key
            if let Some(timestamp_str) = key_str.split(':').last() {
                if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                    if timestamp > latest_timestamp {
                        latest_timestamp = timestamp;
                        match serde_json::from_slice::<Equity>(&value) {
                            Ok(equity) => latest_data = Some(equity),
                            Err(_) => {
                                // Silently skip incompatible data - equity data is optional
                            }
                        }
                    }
                }
            }
        }

        Ok(latest_data)
    }

    async fn get_all_symbols(&self) -> Result<Vec<String>> {
        Ok(self.get_all_symbols_from_db()?)
    }

    async fn get_historical_data(
        &self,
        symbol: &str,
        from: DateTime<Utc>,
        to: DateTime<Utc>,
    ) -> Result<Vec<TimeSeriesPoint>> {
        let prefix = format!("stock:{}:live:", symbol);
        let iter = self.db.prefix_iterator(&prefix);

        let mut data_points = Vec::new();

        for item in iter {
            let (key, value) = item?;
            let key_str = String::from_utf8_lossy(&key);

            // Extract timestamp from key
            if let Some(timestamp_str) = key_str.split(':').last() {
                if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                    let dt = DateTime::from_timestamp(timestamp, 0).unwrap_or(from);

                    if dt >= from && dt <= to {
                        if let Ok(live_data) = serde_json::from_slice::<EquityLive>(&value) {
                            data_points.push(TimeSeriesPoint {
                                timestamp: dt,
                                value: live_data.price,
                                volume: Some(live_data.volume),
                            });
                        }
                    }
                }
            }
        }

        // Sort by timestamp
        data_points.sort_by_key(|dp| dp.timestamp);
        Ok(data_points)
    }

    async fn store_market_summary(
        &self,
        summary: &MarketSummary,
        timestamp: DateTime<Utc>,
    ) -> Result<()> {
        let key = Self::market_summary_key(&timestamp);
        let value = serde_json::to_vec(summary)?;

        self.db
            .put(key.as_bytes(), &value)
            .context("Failed to store market summary")?;

        Ok(())
    }

    async fn get_latest_market_summary(&self) -> Result<Option<MarketSummary>> {
        let prefix = "market:summary:";
        let iter = self.db.prefix_iterator(prefix);

        let mut latest_timestamp = 0i64;
        let mut latest_summary = None;

        for item in iter {
            let (key, value) = item?;
            let key_str = String::from_utf8_lossy(&key);

            // Extract timestamp from key
            if let Some(timestamp_str) = key_str.split(':').last() {
                if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                    if timestamp > latest_timestamp {
                        latest_timestamp = timestamp;
                        match serde_json::from_slice::<MarketSummary>(&value) {
                            Ok(summary) => latest_summary = Some(summary),
                            Err(e) => {
                                tracing::warn!("Failed to deserialize market summary: {}", e);
                                // Continue to next entry
                            }
                        }
                    }
                }
            }
        }

        Ok(latest_summary)
    }
}
