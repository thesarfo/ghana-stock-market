import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Portfolio } from '../types/portfolio';
import { TransactionType } from '../types/portfolio';
import { portfolioService } from '../services/portfolioService';
import { Card, Button, LoadingSpinner } from '../components/ui';
import {
  ArrowLeftIcon,
  ChartPieIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export const PortfolioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation state
  const [simAmount, setSimAmount] = useState<number>(1000);
  const [simMonths, setSimMonths] = useState<number>(12);
  const [simResult, setSimResult] = useState<{ value: number; growth: number } | null>(null);

  useEffect(() => {
    if (id) loadPortfolio(id);
  }, [id]);

  const loadPortfolio = async (portfolioId: string) => {
    try
    {
      const data = await portfolioService.getPortfolio(portfolioId);
      setPortfolio(data);
    } catch (err)
    {
      setError('Failed to load portfolio');
    } finally
    {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    if (!portfolio) return 0;
    // In a real app, we'd need current prices. For now, we'll use average buy price as a proxy
    // or fetch current prices. Let's assume we have current prices available or just use cost basis for now.
    return portfolio.items.reduce((sum, item) => sum + (item.quantity * item.average_buy_price), 0);
  };

  const runSimulation = () => {
    // Simple simulation logic: assume random market growth between -10% and +20% per year
    // This is "fake money" simulation as requested.
    const monthlyRate = (Math.random() * 0.3 - 0.1) / 12; // Random monthly rate
    const futureValue = simAmount * Math.pow(1 + monthlyRate, simMonths);
    const growth = ((futureValue - simAmount) / simAmount) * 100;

    setSimResult({ value: futureValue, growth });
  };

  if (loading)
  {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!portfolio)
  {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-danger-600 mb-4 font-medium">Portfolio not found</p>
          <Button onClick={() => navigate('/portfolios')} variant="primary">
            Back to Portfolios
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/portfolios')} className="pl-0 hover:bg-transparent">
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Portfolios
        </Button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-900 p-5 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-balance">{portfolio.name}</h1>
            <p className="text-gray-400 flex items-center text-sm sm:text-base">
              <ClockIcon className="size-4 mr-2" />
              Created {new Date(portfolio.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider mb-1">Total Value (Cost Basis)</p>
            <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{calculateTotalValue().toFixed(2)} GHS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Section */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="size-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ChartPieIcon className="size-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Holdings</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Avg Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {portfolio.items.map((item) => (
                    <tr key={item.symbol} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link to={`/stock/${item.symbol}`} className="hover:text-primary-600 hover:underline">
                          {item.symbol}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 tabular-nums">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-600 tabular-nums">{item.average_buy_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">
                        {(item.quantity * item.average_buy_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {portfolio.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No holdings yet. Go to a stock page to add transactions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BanknotesIcon className="size-5 text-gray-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {portfolio.transactions.slice().reverse().map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.transaction_type === TransactionType.Buy
                          ? 'bg-success-50 text-success-700'
                          : 'bg-danger-50 text-danger-700'
                          }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.symbol}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600 tabular-nums">{tx.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600 tabular-nums">{tx.price_per_share.toFixed(2)}</td>
                    </tr>
                  ))}
                  {portfolio.transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar / Simulation */}
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary-600 p-6 text-white shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-6">
                <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="size-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-balance">Investment Simulator</h2>
              </div>

              <p className="text-primary-100 text-sm mb-6 leading-relaxed text-pretty">
                See how your investments would look like when you pump in some fake money given the current state of the stock market.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-primary-200 mb-1 uppercase tracking-wider">Investment Amount (GHS)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-200 mb-1 uppercase tracking-wider">Duration (Months)</label>
                  <input
                    type="number"
                    value={simMonths}
                    onChange={(e) => setSimMonths(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 tabular-nums"
                  />
                </div>
                <Button
                  onClick={runSimulation}
                  className="w-full bg-white text-primary-600 hover:bg-primary-50 border-none mt-4"
                >
                  Simulate Growth
                </Button>
              </div>

              {simResult && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="text-sm text-primary-200 mb-1">Projected Value</div>
                  <div className="text-3xl font-bold mb-2 tabular-nums">{simResult.value.toFixed(2)} GHS</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/20 tabular-nums ${simResult.growth >= 0 ? 'text-green-300' : 'text-red-300'
                    }`}>
                    {simResult.growth >= 0 ? '+' : ''}{simResult.growth.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
