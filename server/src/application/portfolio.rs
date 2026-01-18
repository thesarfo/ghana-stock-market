use crate::domain::{Portfolio, PortfolioRepository, Transaction};
use anyhow::Result;
use std::sync::Arc;

pub struct PortfolioUseCase {
    repository: Arc<dyn PortfolioRepository + Send + Sync>,
}

impl PortfolioUseCase {
    pub fn new(repository: Arc<dyn PortfolioRepository + Send + Sync>) -> Self {
        Self { repository }
    }

    pub async fn create_portfolio(&self, name: String) -> Result<Portfolio> {
        let portfolio = Portfolio::new(name);
        self.repository.create_portfolio(&portfolio).await?;
        Ok(portfolio)
    }

    pub async fn get_portfolio(&self, id: &str) -> Result<Option<Portfolio>> {
        self.repository.get_portfolio(id).await
    }

    pub async fn get_all_portfolios(&self) -> Result<Vec<Portfolio>> {
        self.repository.get_all_portfolios().await
    }

    pub async fn add_transaction(
        &self,
        portfolio_id: &str,
        transaction: Transaction,
    ) -> Result<Portfolio> {
        let mut portfolio = self
            .repository
            .get_portfolio(portfolio_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Portfolio not found"))?;

        portfolio.add_transaction(transaction);
        self.repository.update_portfolio(&portfolio).await?;

        Ok(portfolio)
    }

    pub async fn delete_portfolio(&self, id: &str) -> Result<()> {
        self.repository.delete_portfolio(id).await
    }
}
