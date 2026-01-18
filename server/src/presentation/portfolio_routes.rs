<use crate::application::PortfolioUseCase;
use crate::domain::{Transaction, TransactionType};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct CreatePortfolioRequest {
    name: String,
}

#[derive(Deserialize)]
pub struct AddTransactionRequest {
    symbol: String,
    transaction_type: TransactionType,
    quantity: i64,
    price_per_share: f64,
}

pub fn portfolio_routes(use_case: Arc<PortfolioUseCase>) -> Router {
    Router::new()
        .route("/", post(create_portfolio).get(get_all_portfolios))
        .route("/:id", get(get_portfolio).delete(delete_portfolio))
        .route("/:id/transactions", post(add_transaction))
        .with_state(use_case)
}

async fn create_portfolio(
    State(use_case): State<Arc<PortfolioUseCase>>,
    Json(payload): Json<CreatePortfolioRequest>,
) -> impl IntoResponse {
    match use_case.create_portfolio(payload.name).await {
        Ok(portfolio) => (StatusCode::CREATED, Json(portfolio)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_all_portfolios(
    State(use_case): State<Arc<PortfolioUseCase>>,
) -> impl IntoResponse {
    match use_case.get_all_portfolios().await {
        Ok(portfolios) => Json(portfolios).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_portfolio(
    State(use_case): State<Arc<PortfolioUseCase>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match use_case.get_portfolio(&id).await {
        Ok(Some(portfolio)) => Json(portfolio).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Portfolio not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn add_transaction(
    State(use_case): State<Arc<PortfolioUseCase>>,
    Path(id): Path<String>,
    Json(payload): Json<AddTransactionRequest>,
) -> impl IntoResponse {
    let transaction = Transaction {
        id: uuid::Uuid::new_v4().to_string(),
        symbol: payload.symbol,
        transaction_type: payload.transaction_type,
        quantity: payload.quantity,
        price_per_share: payload.price_per_share,
        timestamp: chrono::Utc::now(),
    };

    match use_case.add_transaction(&id, transaction).await {
        Ok(portfolio) => Json(portfolio).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn delete_portfolio(
    State(use_case): State<Arc<PortfolioUseCase>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match use_case.delete_portfolio(&id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
