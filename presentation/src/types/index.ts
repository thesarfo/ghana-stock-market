// Base API response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Director information
export interface Director {
  name: string;
  position?: string;
}

// Company information
export interface Company {
  address?: string;
  directors: Director[];
  email?: string;
  facsimile?: string;
  industry?: string;
  name: string;
  sector?: string;
  telephone?: string;
  website?: string;
}

// Live trading data
export interface EquityLive {
  change: number;
  name: string;
  price: number;
  volume: number;
}

// Detailed equity information
export interface Equity {
  capital?: number;
  company: Company;
  dps?: number; // Dividend per share
  eps?: number; // Earnings per share
  name: string;
  price: number;
  shares?: number;
}

// Time series data point
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  volume?: number;
}

// Market summary
export interface MarketSummary {
  total_market_cap: number;
  total_volume: number;
  total_stocks: number;
  top_gainers: EquityLive[];
  top_losers: EquityLive[];
  last_updated: string;
}

// Stock with combined data
export interface Stock {
  symbol: string;
  equity: Equity;
  live_data?: EquityLive;
  last_updated: string;
}

// Chart data for visualization
export interface ChartData {
  timestamp: string;
  price: number;
  volume?: number;
  change?: number;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Theme
export type Theme = 'light' | 'dark';
