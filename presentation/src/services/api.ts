import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
  type ApiResponse,
  type EquityLive,
  type MarketSummary,
  type TimeSeriesPoint,
  type Stock,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        return response;
      },
      (error) => {
        console.error('Response error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Get all stocks
  async getAllStocks(): Promise<ApiResponse<EquityLive[]>> {
    const response = await this.client.get('/api/stocks');
    return response.data;
  }

  // Get stock by symbol
  async getStockBySymbol(symbol: string): Promise<ApiResponse<Stock>> {
    const response = await this.client.get(`/api/stocks/${symbol}`);
    return response.data;
  }

  // Get historical data for a stock
  async getStockHistory(
    symbol: string,
    from?: string,
    to?: string
  ): Promise<ApiResponse<TimeSeriesPoint[]>> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await this.client.get(
      `/api/stocks/${symbol}/history?${params.toString()}`
    );
    return response.data;
  }

  // Get market summary
  async getMarketSummary(): Promise<ApiResponse<MarketSummary>> {
    const response = await this.client.get('/api/market/summary');
    return response.data;
  }

  // Trigger data refresh (admin endpoint)
  async triggerDataRefresh(): Promise<ApiResponse<{ message: string; status: string }>> {
    const response = await this.client.post('/api/admin/refresh');
    return response.data;
  }

  // Trigger equity data refresh (admin endpoint - use sparingly)
  async triggerEquityRefresh(): Promise<ApiResponse<{ message: string; status: string }>> {
    const response = await this.client.post('/api/admin/refresh-equity');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
