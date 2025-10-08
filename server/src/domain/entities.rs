use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Represents a director of a company
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Director {
    pub name: String,
    pub position: Option<String>,
}

/// Represents company information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Company {
    pub address: Option<String>,
    pub directors: Vec<Director>,
    pub email: Option<String>,
    pub facsimile: Option<String>,
    pub industry: Option<String>,
    pub name: String,
    pub sector: Option<String>,
    pub telephone: Option<String>,
    pub website: Option<String>,
}

/// Represents live trading data for a stock
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquityLive {
    pub change: f64,
    pub name: String,
    pub price: f64,
    pub volume: i64,
}

/// Represents detailed equity information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Equity {
    pub capital: Option<f64>,
    pub company: Company,
    pub dps: Option<f64>, // Dividend per share
    pub eps: Option<f64>, // Earnings per share
    pub name: String,
    pub price: f64,
    pub shares: Option<i64>,
}

/// Represents simplified equity information (from /equities endpoint)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquitySummary {
    pub name: String,
    pub price: f64,
}

/// Represents market summary data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketSummary {
    pub total_market_cap: f64,
    pub total_volume: i64,
    pub total_stocks: usize,
    pub top_gainers: Vec<EquityLive>,
    pub top_losers: Vec<EquityLive>,
    pub last_updated: DateTime<Utc>,
}

/// Represents a stock with its historical data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stock {
    pub symbol: String,
    pub equity: Equity,
    pub live_data: Option<EquityLive>,
    pub last_updated: DateTime<Utc>,
}

/// Represents time series data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
    pub volume: Option<i64>,
}

/// Represents historical data for a stock
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockHistory {
    pub symbol: String,
    pub data_points: Vec<TimeSeriesPoint>,
}
