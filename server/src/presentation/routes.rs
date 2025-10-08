use crate::presentation::handlers::*;
use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;

/// Create the main API router
pub fn create_router(
    get_use_case: Arc<crate::application::GetStockDataUseCase>,
    fetch_use_case: Arc<crate::application::FetchStockDataUseCase>,
) -> Router {
    Router::new()
        // Health check
        .route("/health", get(health_check))
        // Stock endpoints
        .route(
            "/api/stocks",
            get({
                let get_use_case = get_use_case.clone();
                move || get_all_stocks(get_use_case)
            }),
        )
        .route(
            "/api/stocks/:symbol",
            get({
                let get_use_case = get_use_case.clone();
                move |path| get_stock_by_symbol(path, get_use_case)
            }),
        )
        .route(
            "/api/stocks/:symbol/history",
            get({
                let get_use_case = get_use_case.clone();
                move |path, query| get_stock_history(path, query, get_use_case)
            }),
        )
        // Market endpoints
        .route(
            "/api/market/summary",
            get({
                let get_use_case = get_use_case.clone();
                move || get_market_summary(get_use_case)
            }),
        )
        // Admin endpoints
        .route(
            "/api/admin/refresh",
            post({
                let fetch_use_case = fetch_use_case.clone();
                move || trigger_data_refresh(fetch_use_case)
            }),
        )
        .route(
            "/api/admin/refresh-equity",
            post({
                let fetch_use_case = fetch_use_case.clone();
                move || trigger_equity_refresh(fetch_use_case)
            }),
        )
}
