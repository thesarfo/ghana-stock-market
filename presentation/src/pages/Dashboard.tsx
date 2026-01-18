import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type EquityLive, type MarketSummary } from '../types';
import { Card, CardContent, LoadingSpinner } from '../components/ui';
import { StockCard } from '../components/StockCard';
import { apiService } from '../services/api';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Building2
} from 'lucide-react';
import { formatLargeNumber, formatNumber } from '../utils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<EquityLive[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try
    {
      setError(null);

      // Fetch stocks and market summary in parallel
      const [stocksResponse, summaryResponse] = await Promise.all([
        apiService.getAllStocks(),
        apiService.getMarketSummary(),
      ]);

      if (stocksResponse.success && stocksResponse.data)
      {
        setStocks(stocksResponse.data);
      }

      if (summaryResponse.success && summaryResponse.data)
      {
        setMarketSummary(summaryResponse.data);
      }
    } catch (err)
    {
      setError('Failed to fetch market data');
      console.error('Error fetching data:', err);
    } finally
    {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try
    {
      await apiService.triggerDataRefresh();
      setTimeout(fetchData, 2000);
    } catch (err)
    {
      console.error('Error refreshing data:', err);
    } finally
    {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
  {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" text="Loading market data..." />
      </div>
    );
  }

  if (error)
  {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent>
            <div className="text-center">
              <p className="text-danger-600 mb-4">{error}</p>
              <button onClick={fetchData} className="btn-primary">
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gainers = stocks.filter(s => s.change > 0);
  const losers = stocks.filter(s => s.change < 0);
  const unchanged = stocks.filter(s => s.change === 0);

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="size-9 sm:size-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Activity className="size-5 sm:size-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 text-balance">
                  Ghana Stock Exchange
                </h1>
                <p className="text-xs text-gray-500 text-pretty hidden sm:block">Real-time Market Data</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw className={`size-4 sm:size-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium hidden sm:inline">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Market Stats Overview - Compact Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {/* Market Cap */}
          <Card className="bg-primary-50 border-primary-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Activity className="size-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Market Cap</p>
                  <p className="text-xl font-bold text-gray-900 truncate tabular-nums">
                    {marketSummary?.total_market_cap
                      ? `₵${formatLargeNumber(marketSummary.total_market_cap)}`
                      : '₵0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Stocks */}
          <Card className="bg-primary-50 border-primary-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="size-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Stocks</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">
                    {marketSummary?.total_stocks || stocks.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gainers */}
          <Card className="bg-success-50 border-success-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="size-5 text-success-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Gainers</p>
                  <p className="text-xl font-bold text-success-600 tabular-nums">
                    {gainers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Losers */}
          <Card className="bg-danger-50 border-danger-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-danger-100 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingDown className="size-5 text-danger-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Losers</p>
                  <p className="text-xl font-bold text-danger-600 tabular-nums">
                    {losers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="bg-primary-50 border-primary-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <BarChart3 className="size-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Volume</p>
                  <p className="text-xl font-bold text-gray-900 truncate tabular-nums">
                    {formatLargeNumber(marketSummary?.total_volume || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Movers */}
        {marketSummary && (marketSummary.top_gainers.length > 0 || marketSummary.top_losers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Top Gainers */}
            {marketSummary.top_gainers.length > 0 && (
              <Card>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="size-7 bg-success-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="size-4 text-success-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900 text-balance">Top Gainers</h2>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {marketSummary.top_gainers.map((stock, index) => (
                      <div
                        key={stock.name}
                        className="flex items-center p-4 bg-success-50 rounded-lg border border-success-100 hover:border-success-200 transition-colors cursor-pointer"
                        onClick={() => navigate(`/stock/${stock.name}`)}
                      >
                        <div className="size-8 bg-success-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 mx-4">
                          <p className="font-bold text-gray-900">{stock.name}</p>
                          <p className="text-xs text-gray-600 tabular-nums">GHS {stock.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-success-600 tabular-nums">
                            +{stock.change.toFixed(2)}%
                          </p>
                          <p className="text-xs text-gray-500 tabular-nums">
                            {formatNumber(stock.volume)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Losers */}
            {marketSummary.top_losers.length > 0 && (
              <Card>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="size-7 bg-danger-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="size-4 text-danger-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900 text-balance">Top Losers</h2>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {marketSummary.top_losers.map((stock, index) => (
                      <div
                        key={stock.name}
                        className="flex items-center p-4 bg-danger-50 rounded-lg border border-danger-100 hover:border-danger-200 transition-colors cursor-pointer"
                        onClick={() => navigate(`/stock/${stock.name}`)}
                      >
                        <div className="size-8 bg-danger-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 mx-4">
                          <p className="font-bold text-gray-900">{stock.name}</p>
                          <p className="text-xs text-gray-600 tabular-nums">GHS {stock.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-danger-600 tabular-nums">
                            {stock.change.toFixed(2)}%
                          </p>
                          <p className="text-xs text-gray-500 tabular-nums">
                            {formatNumber(stock.volume)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* All Stocks Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-balance">All Stocks</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {gainers.length} rising • {losers.length} falling • {unchanged.length} unchanged
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-success-50 rounded-lg">
                <div className="size-1.5 bg-success-600 rounded-full"></div>
                <span className="text-success-700 font-medium tabular-nums">{gainers.length}</span>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-danger-50 rounded-lg">
                <div className="size-1.5 bg-danger-600 rounded-full"></div>
                <span className="text-danger-700 font-medium tabular-nums">{losers.length}</span>
              </div>
            </div>
          </div>

          {stocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stocks.map((stock) => (
                <StockCard key={stock.name} stock={stock} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Activity className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No stock data available</p>
                  <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Load Data
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Data updates every hour during trading hours (Mon-Fri, 10:00-15:00 GMT) • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};