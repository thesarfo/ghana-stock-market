export type TransactionType = 'Buy' | 'Sell';
export const TransactionType = {
  Buy: 'Buy' as TransactionType,
  Sell: 'Sell' as TransactionType,
};

export interface Transaction {
  id: string;
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_share: number;
  timestamp: string;
}

export interface PortfolioItem {
  symbol: string;
  quantity: number;
  average_buy_price: number;
}

export interface Portfolio {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: PortfolioItem[];
  transactions: Transaction[];
}

export interface CreatePortfolioRequest {
  name: string;
}

export interface AddTransactionRequest {
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_share: number;
}
