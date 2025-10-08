use crate::application::worker::{DataScrapingWorker, WorkerConfig};
use crate::application::{FetchStockDataUseCase, GetStockDataUseCase};
use crate::infrastructure::{GseApiClientImpl, RocksDbStockRepository};
use crate::presentation::create_router;
use anyhow::Result;
use std::sync::Arc;
use tokio::signal;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{info, Level};

mod application;
mod domain;
mod infrastructure;
mod presentation;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt().with_max_level(Level::INFO).init();

    info!("Starting GSE Backend Service");

    // Initialize database
    let repository = Arc::new(RocksDbStockRepository::new("./data/gse.db")?);
    info!("Database initialized");

    // Initialize API client
    let api_client = Arc::new(GseApiClientImpl::new());
    info!("GSE API client initialized");

    // Initialize use cases
    let fetch_use_case = Arc::new(FetchStockDataUseCase::new(
        api_client.clone(),
        repository.clone(),
    ));
    let get_use_case = Arc::new(GetStockDataUseCase::new(
        repository.clone(),
        api_client.clone(),
    ));

    // Start background worker
    let worker_config = WorkerConfig {
        scrape_interval: std::env::var("SCRAPE_INTERVAL")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(3600), // Default 1 hour
        max_retries: std::env::var("MAX_RETRIES")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(3),
        retry_delay: std::env::var("RETRY_DELAY")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(5),
        fetch_equity_data: std::env::var("FETCH_EQUITY_DATA")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(true),
        generate_market_summary: std::env::var("GENERATE_MARKET_SUMMARY")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(true),
    };

    let worker = Arc::new(DataScrapingWorker::new(
        fetch_use_case.clone(),
        worker_config.clone(),
    ));

    // Start worker in background
    let worker_clone = worker.clone();
    tokio::spawn(async move {
        if let Err(e) = worker_clone.start().await {
            tracing::error!("Worker failed: {}", e);
        }
    });

    info!("Background worker started with config: {:?}", worker_config);

    // Generate initial market summary if none exists
    tokio::spawn({
        let fetch_use_case = fetch_use_case.clone();
        async move {
            info!("Ensuring initial data availability...");
            if let Err(e) = fetch_use_case.fetch_and_store_all_live_data().await {
                tracing::error!("Initial data fetch failed: {}", e);
            } else {
                if let Err(e) = fetch_use_case.generate_and_store_market_summary().await {
                    tracing::error!("Initial market summary generation failed: {}", e);
                } else {
                    info!("Initial data and summary ready");
                }
            }
        }
    });

    // Create and start web server
    let app = create_router(get_use_case, fetch_use_case)
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3000);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    info!("Server listening on port {}", port);

    // Start server
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("Server shutdown complete");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    info!("Shutdown signal received");
}
