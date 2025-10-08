use crate::application::use_cases::FetchStockDataUseCase;
use anyhow::Result;
use chrono::{Datelike, Timelike, Utc, Weekday};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::{interval, sleep};
use tracing::{error, info, warn};

/// Configuration for the data scraping worker
#[derive(Debug, Clone)]
pub struct WorkerConfig {
    /// Interval between scraping operations (in seconds)
    pub scrape_interval: u64,
    /// Maximum number of retries for failed operations
    pub max_retries: u32,
    /// Delay between retries (in seconds)
    pub retry_delay: u64,
    /// Whether to fetch detailed equity data
    pub fetch_equity_data: bool,
    /// Whether to generate market summary
    pub generate_market_summary: bool,
}

impl Default for WorkerConfig {
    fn default() -> Self {
        Self {
            scrape_interval: 3600, // 1 hour
            max_retries: 3,
            retry_delay: 5,
            fetch_equity_data: true,
            generate_market_summary: true,
        }
    }
}

/// Background worker for scraping GSE data
pub struct DataScrapingWorker {
    use_case: Arc<FetchStockDataUseCase>,
    config: WorkerConfig,
}

impl DataScrapingWorker {
    pub fn new(use_case: Arc<FetchStockDataUseCase>, config: WorkerConfig) -> Self {
        Self { use_case, config }
    }

    /// Check if current time is within GSE trading hours
    /// Trading hours: Monday-Friday, 10:00 AM - 3:00 PM GMT
    fn is_trading_hours() -> bool {
        let now = Utc::now();

        // Check if it's a weekday (Monday = 0, Sunday = 6)
        let is_weekday = matches!(
            now.weekday(),
            Weekday::Mon | Weekday::Tue | Weekday::Wed | Weekday::Thu | Weekday::Fri
        );

        if !is_weekday {
            return false;
        }

        // Check if time is between 10:00 and 15:00 (3:00 PM)
        let hour = now.hour();
        hour >= 10 && hour < 15
    }

    /// Start the worker with the configured interval
    pub async fn start(&self) -> Result<()> {
        info!(
            "Starting data scraping worker with interval: {} seconds",
            self.config.scrape_interval
        );

        let mut interval_timer = interval(Duration::from_secs(self.config.scrape_interval));

        // Run initial scrape
        let _ = self.run_scrape_cycle().await;

        loop {
            interval_timer.tick().await;

            if let Err(e) = self.run_scrape_cycle().await {
                error!("Scrape cycle failed: {}", e);
            }
        }
    }

    /// Run a complete scrape cycle
    async fn run_scrape_cycle(&self) -> Result<()> {
        let now = Utc::now();
        info!("Starting scrape cycle at {}", now);

        // Check if we're within trading hours
        if !Self::is_trading_hours() {
            info!(
                "Outside trading hours (Monday-Friday 10:00-15:00 GMT). Current time: {} ({}). Skipping scrape.",
                now.format("%Y-%m-%d %H:%M:%S GMT"),
                now.weekday()
            );
            return Ok(());
        }

        info!("Within trading hours. Proceeding with data scrape.");

        // Fetch live data
        if let Err(e) = self
            .fetch_with_retry("live data", || {
                self.use_case.fetch_and_store_all_live_data()
            })
            .await
        {
            error!("Failed to fetch live data: {}", e);
            return Err(e);
        }

        // Fetch equity data if enabled (but less frequently to avoid rate limits)
        if self.config.fetch_equity_data {
            // Skip equity data fetching for now to avoid rate limits
            // This can be enabled later with proper rate limiting
            info!("Skipping equity data fetch to avoid rate limits");
        }

        // Generate market summary if enabled
        if self.config.generate_market_summary {
            if let Err(e) = self
                .fetch_with_retry("market summary", || {
                    self.use_case.generate_and_store_market_summary()
                })
                .await
            {
                warn!("Failed to generate market summary: {}", e);
                // Don't fail the entire cycle for market summary
            }
        }

        info!("Completed scrape cycle at {}", Utc::now());
        Ok(())
    }

    /// Execute an operation with retry logic
    async fn fetch_with_retry<F, Fut>(&self, operation_name: &str, operation: F) -> Result<()>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<()>>,
    {
        let mut retries = 0;

        while retries <= self.config.max_retries {
            match operation().await {
                Ok(()) => {
                    info!("Successfully completed {}", operation_name);
                    return Ok(());
                }
                Err(e) if retries < self.config.max_retries => {
                    retries += 1;
                    warn!("Failed to {} (attempt {}): {}", operation_name, retries, e);
                    sleep(Duration::from_secs(self.config.retry_delay)).await;
                }
                Err(e) => {
                    error!(
                        "Failed to {} after {} retries: {}",
                        operation_name, self.config.max_retries, e
                    );
                    return Err(e);
                }
            }
        }

        Ok(())
    }
}
