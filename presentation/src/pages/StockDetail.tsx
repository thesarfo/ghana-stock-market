import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Equity, type EquityLive, type TimeSeriesPoint } from '../types';
import { Card, Button, LoadingSpinner, Modal } from '../components/ui';
import { InteractiveChart } from '../components/charts/InteractiveChart';
import { portfolioService } from '../services/portfolioService';
import { TransactionType } from '../types/portfolio';
import type { Portfolio } from '../types/portfolio';
import { apiService } from '../services/api';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getChangeColorClass
} from '../utils';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  BriefcaseIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface StockData {
  equity?: Equity;
  live_data?: EquityLive;
  name?: string;
  price?: number;
}

export const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Portfolio Modal State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [transactionQty, setTransactionQty] = useState(100);
  const [transactionType, setTransactionType] = useState<TransactionType>('Buy' as TransactionType);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;

    const fetchStockData = async () => {
      try
      {
        setLoading(true);
        setError(null);

        // Fetch stock details
        const stockResponse = await apiService.getStockBySymbol(symbol);
        if (stockResponse.success && stockResponse.data)
        {
          const data = stockResponse.data as any;
          setStockData({
            equity: data.company ? data : undefined,
            live_data: data.live_data,
            name: data.name,
            price: data.price,
          });
        }

        // Fetch historical data
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const historyResponse = await apiService.getStockHistory(
          symbol,
          fromDate.toISOString(),
          toDate.toISOString()
        );

        if (historyResponse.success && historyResponse.data)
        {
          setHistoricalData(historyResponse.data);
        }
      } catch (err)
      {
        setError('Failed to fetch stock data');
        console.error('Error fetching stock data:', err);
      } finally
      {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, timeRange]);

  useEffect(() => {
    if (showPortfolioModal)
    {
      loadPortfolios();
    }
  }, [showPortfolioModal]);

  const loadPortfolios = async () => {
    try
    {
      const data = await portfolioService.getAllPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolioId)
      {
        setSelectedPortfolioId(data[0].id);
      }
    } catch (err)
    {
      console.error('Failed to load portfolios', err);
    }
  };

  const handleAddToPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioId || !stockData) return;

    setPortfolioLoading(true);
    try
    {
      const price = stockData.live_data?.price || stockData.price || stockData.equity?.price || 0;

      await portfolioService.addTransaction(selectedPortfolioId, {
        symbol: symbol!,
        transaction_type: transactionType,
        quantity: transactionQty,
        price_per_share: price,
      });

      setShowPortfolioModal(false);
      // Optional: Show toast notification
    } catch (err)
    {
      console.error('Failed to add transaction', err);
    } finally
    {
      setPortfolioLoading(false);
    }
  };

  if (loading)
  {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !stockData)
  {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-danger-600 mb-4 font-medium">{error || 'Stock not found'}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const { equity, live_data, name, price } = stockData;
  const currentPrice = live_data?.price || equity?.price || price || 0;
  const change = live_data?.change || 0;
  const stockName = equity?.name || name || symbol || '';
  const companyName = equity?.company?.name || stockName;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <Button variant="ghost" onClick={() => navigate('/')} className="pl-0 hover:bg-transparent">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Stock Header */}
      <Card className="p-5 sm:p-8 border-l-4 border-l-primary-500">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">{stockName}</h1>
              {isPositive && (
                <div className="px-2 sm:px-3 py-1 bg-success-50 text-success-700 rounded-full flex items-center">
                  <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-bold">Bullish</span>
                </div>
              )}
              {isNegative && (
                <div className="px-2 sm:px-3 py-1 bg-danger-50 text-danger-700 rounded-full flex items-center">
                  <ArrowTrendingDownIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-bold">Bearish</span>
                </div>
              )}
            </div>
            <p className="text-base sm:text-lg text-gray-500">{companyName}</p>
          </div>

          <div className="text-left md:text-right flex flex-col items-start md:items-end">
            <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2 tracking-tight tabular-nums">
              {formatCurrency(currentPrice)}
            </p>
            <div className={`inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl ${isPositive ? 'bg-success-50 text-success-700' : isNegative ? 'bg-danger-50 text-danger-700' : 'bg-gray-100 text-gray-700'
              }`}>
              <span className="text-base sm:text-lg font-bold tabular-nums">
                {isPositive && '+'}{formatPercentage(change)}
              </span>
            </div>
            <Button
              variant="primary"
              className="mt-4 sm:mt-6 shadow-lg shadow-primary-500/20 w-full md:w-auto justify-center"
              onClick={() => setShowPortfolioModal(true)}
            >
              Add to Portfolio
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
          {live_data && (
            <>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volume</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(live_data.volume)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Change</p>
                <p className={`text-xl font-bold ${getChangeColorClass(change)}`}>
                  {isPositive && '+'}{formatCurrency(change)}
                </p>
              </div>
            </>
          )}
          {equity?.shares && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Shares</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(equity.shares)}</p>
            </div>
          )}
          {equity?.capital && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Cap</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(equity.capital)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Price Chart */}
      <Card>
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Price History</h2>
            <p className="text-sm text-gray-500 mt-1">
              {historicalData.length} data points available
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${timeRange === range
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {historicalData.length > 0 ? (
            <InteractiveChart data={historicalData} symbol={stockName} />
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No historical data available yet</p>
              <p className="text-sm text-gray-400 mt-2">Charts will appear as data accumulates</p>
            </div>
          )}
        </div>
      </Card>

      {/* Company Information & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Details */}
        {equity?.company && (
          <Card className="lg:col-span-2 h-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="size-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BuildingOffice2Icon className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Company Name</p>
                <p className="text-lg font-semibold text-gray-900">{equity.company.name}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {equity.company.sector && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Sector</p>
                    <div className="flex items-center space-x-2">
                      <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                      <p className="font-semibold text-gray-900">{equity.company.sector}</p>
                    </div>
                  </div>
                )}
                {equity.company.industry && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Industry</p>
                    <p className="font-semibold text-gray-900">{equity.company.industry}</p>
                  </div>
                )}
              </div>

              {equity.company.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                  <div className="flex items-start space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mt-1" />
                    <p className="text-gray-900">{equity.company.address}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {equity.company.telephone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${equity.company.telephone}`} className="text-primary-600 hover:text-primary-700">
                        {equity.company.telephone}
                      </a>
                    </div>
                  </div>
                )}
                {equity.company.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${equity.company.email}`} className="text-primary-600 hover:text-primary-700">
                        {equity.company.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {equity.company.website && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                    <a
                      href={`https://${equity.company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {equity.company.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Financial Metrics */}
        <Card className="h-full">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Financial Metrics</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
              <p className="text-xs text-primary-600 mb-1 font-medium">Current Price</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentPrice)}</p>
            </div>

            {live_data && live_data.volume > 0 && (
              <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                <p className="text-xs text-primary-600 mb-1 font-medium">Trading Volume</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(live_data.volume)}</p>
              </div>
            )}

            {equity?.eps && (
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 mb-1 font-medium">Earnings Per Share</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(equity.eps)}</p>
              </div>
            )}

            {equity?.dps && (
              <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                <p className="text-xs text-primary-600 mb-1 font-medium">Dividend Per Share</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(equity.dps)}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Board of Directors */}
      {equity?.company?.directors && equity.company.directors.length > 0 && (
        <Card>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="size-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Board of Directors</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equity.company.directors.map((director, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all bg-gray-50/50"
                >
                  <div className="flex items-start space-x-3">
                    <div className="size-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {director.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-tight mb-1">
                        {director.name}
                      </p>
                      {director.position && (
                        <p className="text-xs text-gray-500 leading-tight">
                          {director.position}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Portfolio Modal */}
      <Modal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        title="Add to Portfolio"
      >
        {portfolios.length === 0 ? (
          <div className="text-center py-6">
            <p className="mb-4 text-gray-600">You don't have any portfolios yet.</p>
            <Button
              onClick={() => navigate('/portfolios')}
              variant="primary"
            >
              Create a Portfolio first
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAddToPortfolio} className="space-y-4">
            <div>
              <label className="label">Select Portfolio</label>
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="input"
                required
              >
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Transaction Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                  flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all
                  ${transactionType === 'Buy'
                    ? 'bg-success-50 border-success-500 text-success-700 ring-1 ring-success-500'
                    : 'border-gray-200 hover:bg-gray-50'}
                `}>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={transactionType === 'Buy'}
                    onChange={() => setTransactionType('Buy' as TransactionType)}
                  />
                  <span className="font-bold">Buy</span>
                </label>
                <label className={`
                  flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all
                  ${transactionType === 'Sell'
                    ? 'bg-danger-50 border-danger-500 text-danger-700 ring-1 ring-danger-500'
                    : 'border-gray-200 hover:bg-gray-50'}
                `}>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={transactionType === 'Sell'}
                    onChange={() => setTransactionType('Sell' as TransactionType)}
                  />
                  <span className="font-bold">Sell</span>
                </label>
              </div>
            </div>

            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                value={transactionQty}
                onChange={(e) => setTransactionQty(Number(e.target.value))}
                className="input"
                min="1"
                required
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPortfolioModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={portfolioLoading}
              >
                Add Transaction
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};