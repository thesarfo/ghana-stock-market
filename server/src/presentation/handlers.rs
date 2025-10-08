use crate::application::FetchStockDataUseCase;
use crate::application::GetStockDataUseCase;
use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Query parameters for historical data requests
#[derive(Debug, Deserialize)]
pub struct HistoricalDataQuery {
    pub from: Option<String>,
    pub to: Option<String>,
}

/// API response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }
}

/// Handler for getting all stocks
pub async fn get_all_stocks(
    use_case: Arc<GetStockDataUseCase>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, StatusCode> {
    match use_case.get_all_latest_live_data().await {
        Ok(data) => {
            let stocks: Vec<serde_json::Value> = data
                .into_iter()
                .map(|stock| serde_json::to_value(stock).unwrap())
                .collect();
            Ok(Json(ApiResponse::success(stocks)))
        }
        Err(e) => {
            tracing::error!("Failed to get all stocks: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Handler for getting a specific stock by symbol
pub async fn get_stock_by_symbol(
    Path(symbol): Path<String>,
    use_case: Arc<GetStockDataUseCase>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    let symbol_upper = symbol.to_uppercase();
    tracing::info!(
        "Request for stock symbol: {} (normalized: {})",
        symbol,
        symbol_upper
    );
    // First check database
    match use_case.get_symbol_data(&symbol_upper).await {
        Ok(Some((equity, live_data))) => {
            let mut response = serde_json::to_value(equity).unwrap();

            if let Some(live) = live_data {
                response["live_data"] = serde_json::to_value(live).unwrap();
            }

            Ok(Json(ApiResponse::success(response)))
        }
        Ok(None) => {
            // If no equity data in DB, fetch from API on-demand
            match use_case.fetch_fresh_equity_data(&symbol_upper).await {
                Ok(equity) => {
                    let live_data = use_case
                        .get_latest_live_data(&symbol_upper)
                        .await
                        .ok()
                        .flatten();
                    let mut response = serde_json::to_value(equity).unwrap();

                    if let Some(live) = live_data {
                        response["live_data"] = serde_json::to_value(live).unwrap();
                    }

                    Ok(Json(ApiResponse::success(response)))
                }
                Err(_) => {
                    // If API fetch fails, return just live data
                    match use_case.get_latest_live_data(&symbol_upper).await {
                        Ok(Some(live_data)) => {
                            let response = serde_json::json!({
                                "name": symbol_upper,
                                "price": live_data.price,
                                "live_data": live_data
                            });
                            Ok(Json(ApiResponse::success(response)))
                        }
                        _ => {
                            tracing::warn!("Stock not found: {}", symbol_upper);
                            Err(StatusCode::NOT_FOUND)
                        }
                    }
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to get stock {}: {}", symbol, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Handler for getting historical data for a stock
pub async fn get_stock_history(
    Path(symbol): Path<String>,
    Query(params): Query<HistoricalDataQuery>,
    use_case: Arc<GetStockDataUseCase>,
) -> Result<Json<ApiResponse<Vec<serde_json::Value>>>, StatusCode> {
    // Parse date parameters
    let from = params
        .from
        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now() - chrono::Duration::days(30)); // Default to 30 days ago

    let to = params
        .to
        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);

    match use_case.get_historical_data(&symbol, from, to).await {
        Ok(data) => {
            let history: Vec<serde_json::Value> = data
                .into_iter()
                .map(|point| serde_json::to_value(point).unwrap())
                .collect();
            Ok(Json(ApiResponse::success(history)))
        }
        Err(e) => {
            tracing::error!("Failed to get historical data for {}: {}", symbol, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Handler for getting market summary
pub async fn get_market_summary(
    use_case: Arc<GetStockDataUseCase>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match use_case.get_latest_market_summary().await {
        Ok(Some(summary)) => {
            let response = serde_json::to_value(summary).unwrap();
            Ok(Json(ApiResponse::success(response)))
        }
        Ok(None) => {
            tracing::warn!("No market summary available");
            Err(StatusCode::NOT_FOUND)
        }
        Err(e) => {
            tracing::error!("Failed to get market summary: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Handler for manual data refresh trigger
pub async fn trigger_data_refresh(
    use_case: Arc<FetchStockDataUseCase>,
) -> Result<Json<ApiResponse<HashMap<String, String>>>, StatusCode> {
    // Run the scraping in a background task
    let use_case_clone = use_case.clone();
    tokio::spawn(async move {
        if let Err(e) = use_case_clone.fetch_and_store_all_live_data().await {
            tracing::error!("Background data refresh failed: {}", e);
        } else {
            tracing::info!("Background data refresh completed successfully");
        }
    });

    let mut response = HashMap::new();
    response.insert("message".to_string(), "Data refresh triggered".to_string());
    response.insert("status".to_string(), "started".to_string());

    Ok(Json(ApiResponse::success(response)))
}

/// Handler for fetching all equity data (use sparingly due to rate limits)
pub async fn trigger_equity_refresh(
    use_case: Arc<FetchStockDataUseCase>,
) -> Result<Json<ApiResponse<HashMap<String, String>>>, StatusCode> {
    // Run in background with rate limiting
    let use_case_clone = use_case.clone();
    tokio::spawn(async move {
        tracing::info!("Starting equity data refresh...");
        if let Err(e) = use_case_clone.fetch_and_store_all_equity_data().await {
            tracing::error!("Equity data refresh failed: {}", e);
        } else {
            tracing::info!("Equity data refresh completed successfully");
            // Regenerate market summary with new data
            if let Err(e) = use_case_clone.generate_and_store_market_summary().await {
                tracing::error!("Market summary generation failed: {}", e);
            }
        }
    });

    let mut response = HashMap::new();
    response.insert(
        "message".to_string(),
        "Equity data refresh triggered (this will take several minutes)".to_string(),
    );
    response.insert("status".to_string(), "started".to_string());

    Ok(Json(ApiResponse::success(response)))
}

/// Handler for health check
pub async fn health_check() -> Json<ApiResponse<HashMap<String, String>>> {
    let mut response = HashMap::new();
    response.insert("status".to_string(), "healthy".to_string());
    response.insert("timestamp".to_string(), Utc::now().to_rfc3339());

    Json(ApiResponse::success(response))
}
