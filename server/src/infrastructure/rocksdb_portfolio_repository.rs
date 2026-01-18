use crate::domain::{Portfolio, PortfolioRepository};
use anyhow::{Context, Result};
use rocksdb::DB;
use std::sync::Arc;

pub struct RocksDbPortfolioRepository {
    db: Arc<DB>,
}

impl RocksDbPortfolioRepository {
    pub fn new(db: Arc<DB>) -> Self {
        Self { db }
    }

    fn portfolio_key(id: &str) -> String {
        format!("portfolio:{}", id)
    }
}

#[async_trait::async_trait]
impl PortfolioRepository for RocksDbPortfolioRepository {
    async fn create_portfolio(&self, portfolio: &Portfolio) -> Result<()> {
        let key = Self::portfolio_key(&portfolio.id);
        let value = serde_json::to_vec(portfolio)?;

        self.db
            .put(key.as_bytes(), &value)
            .context("Failed to store portfolio")?;

        Ok(())
    }

    async fn get_portfolio(&self, id: &str) -> Result<Option<Portfolio>> {
        let key = Self::portfolio_key(id);
        
        match self.db.get(key.as_bytes())? {
            Some(value) => {
                let portfolio = serde_json::from_slice(&value)?;
                Ok(Some(portfolio))
            },
            None => Ok(None),
        }
    }

    async fn get_all_portfolios(&self) -> Result<Vec<Portfolio>> {
        let prefix = "portfolio:";
        let iter = self.db.prefix_iterator(prefix);
        let mut portfolios = Vec::new();

        for item in iter {
            let (key, value) = item?;
            let key_str = String::from_utf8_lossy(&key);
            
            // Filter out any other keys that might start with portfolio: but aren't portfolios (if any)
            // For now, we assume strict key usage.
            // Also need to ensure we don't pick up sub-keys if we had any (e.g. portfolio:123:history)
            // Our key pattern is simple "portfolio:{uuid}", so checking if it has exactly one colon might be enough,
            // or just trying to deserialize.
            
            if key_str.starts_with(prefix) {
                 match serde_json::from_slice::<Portfolio>(&value) {
                    Ok(portfolio) => portfolios.push(portfolio),
                    Err(_) => {
                        // Ignore non-portfolio items or malformed data
                    }
                }
            }
        }

        Ok(portfolios)
    }

    async fn update_portfolio(&self, portfolio: &Portfolio) -> Result<()> {
        self.create_portfolio(portfolio).await
    }

    async fn delete_portfolio(&self, id: &str) -> Result<()> {
        let key = Self::portfolio_key(id);
        self.db.delete(key.as_bytes()).context("Failed to delete portfolio")?;
        Ok(())
    }
}
