import type { Portfolio, CreatePortfolioRequest, AddTransactionRequest } from '../types/portfolio';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const portfolioService = {
  async getAllPortfolios(): Promise<Portfolio[]> {
    const response = await fetch(`${API_BASE_URL}/api/portfolios`);
    if (!response.ok) throw new Error('Failed to fetch portfolios');
    return response.json();
  },

  async getPortfolio(id: string): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    return response.json();
  },

  async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create portfolio');
    return response.json();
  },

  async deletePortfolio(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete portfolio');
  },

  async addTransaction(portfolioId: string, data: AddTransactionRequest): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add transaction');
    return response.json();
  },
};
