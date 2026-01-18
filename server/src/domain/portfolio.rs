use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    Buy,
    Sell,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub symbol: String,
    pub transaction_type: TransactionType,
    pub quantity: i64,
    pub price_per_share: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioItem {
    pub symbol: String,
    pub quantity: i64,
    pub average_buy_price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Portfolio {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub items: Vec<PortfolioItem>,
    pub transactions: Vec<Transaction>,
}

impl Portfolio {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            items: Vec::new(),
            transactions: Vec::new(),
        }
    }

    pub fn add_transaction(&mut self, transaction: Transaction) {
        self.transactions.push(transaction.clone());
        self.update_holdings(&transaction);
        self.updated_at = Utc::now();
    }

    fn update_holdings(&mut self, transaction: &Transaction) {
        let item_opt = self.items.iter_mut().find(|i| i.symbol == transaction.symbol);

        match item_opt {
            Some(item) => {
                match transaction.transaction_type {
                    TransactionType::Buy => {
                        let total_cost = (item.quantity as f64 * item.average_buy_price)
                            + (transaction.quantity as f64 * transaction.price_per_share);
                        item.quantity += transaction.quantity;
                        item.average_buy_price = total_cost / item.quantity as f64;
                    }
                    TransactionType::Sell => {
                        // When selling, average buy price doesn't change, only quantity reduces
                        item.quantity -= transaction.quantity;
                    }
                }
            }
            None => {
                if let TransactionType::Buy = transaction.transaction_type {
                    self.items.push(PortfolioItem {
                        symbol: transaction.symbol.clone(),
                        quantity: transaction.quantity,
                        average_buy_price: transaction.price_per_share,
                    });
                }
                // If selling something we don't have, we ignore it for now or handle error elsewhere.
                // For simplicity in this domain logic, we assume valid transactions.
            }
        }
        
        // Remove items with 0 quantity
        self.items.retain(|i| i.quantity > 0);
    }
}

#[async_trait::async_trait]
pub trait PortfolioRepository {
    async fn create_portfolio(&self, portfolio: &Portfolio) -> anyhow::Result<()>;
    async fn get_portfolio(&self, id: &str) -> anyhow::Result<Option<Portfolio>>;
    async fn get_all_portfolios(&self) -> anyhow::Result<Vec<Portfolio>>;
    async fn update_portfolio(&self, portfolio: &Portfolio) -> anyhow::Result<()>;
    async fn delete_portfolio(&self, id: &str) -> anyhow::Result<()>;
}
