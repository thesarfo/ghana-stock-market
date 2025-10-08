import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Equity, type EquityLive, type TimeSeriesPoint } from '../types';
import { Card, CardContent, LoadingSpinner } from '../components/ui';
import { PriceChart } from '../components/charts/PriceChart';
import { apiService } from '../services/api';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getChangeColorClass
} from '../utils';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  BarChart3
} from 'lucide-react';

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
          console.log('Stock data received:', stockResponse.data);
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
  }, [symbol, timeRange]); // Re-fetch when symbol or timeRange changes

  if (loading)
  {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" text="Loading stock data..." />
      </div>
    );
  }

  if (error || !stockData)
  {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-danger-600 mb-4">{error || 'Stock not found'}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Back to Dashboard
            </button>
          </CardContent>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stock Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{stockName}</h1>
                {isPositive && (
                  <div className="px-3 py-1 bg-success-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                  </div>
                )}
                {isNegative && (
                  <div className="px-3 py-1 bg-danger-100 rounded-full">
                    <TrendingDown className="h-5 w-5 text-danger-600" />
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-600">{companyName}</p>
            </div>

            <div className="text-right">
              <p className="text-5xl font-bold text-gray-900 mb-2">
                {formatCurrency(currentPrice)}
              </p>
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${isPositive ? 'bg-success-100' : isNegative ? 'bg-danger-100' : 'bg-gray-100'
                }`}>
                <span className={`text-lg font-bold ${getChangeColorClass(change)}`}>
                  {isPositive && '+'}{formatPercentage(change)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {live_data && (
              <>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Volume</p>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(live_data.volume)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Change</p>
                  <p className={`text-xl font-bold ${getChangeColorClass(change)}`}>
                    {isPositive && '+'}{formatCurrency(change)}
                  </p>
                </div>
              </>
            )}
            {equity?.shares && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Shares</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(equity.shares)}</p>
              </div>
            )}
            {equity?.capital && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(equity.capital)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Price Chart */}
        <Card className="mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Price History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {historicalData.length} data points available
                </p>
              </div>
              <div className="flex space-x-2">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${timeRange === range
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {historicalData.length > 0 ? (
              <PriceChart data={historicalData} symbol={stockName} height={400} />
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No historical data available yet</p>
                <p className="text-sm text-gray-400 mt-2">Charts will appear as data accumulates</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Information & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Company Details */}
          {equity?.company && (
            <Card className="lg:col-span-2">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Company Name</p>
                    <p className="text-lg font-semibold text-gray-900">{equity.company.name}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {equity.company.sector && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Sector</p>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
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
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <p className="text-gray-900">{equity.company.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {equity.company.telephone && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
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
                          <Mail className="h-4 w-4 text-gray-400" />
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
                        <Globe className="h-4 w-4 text-gray-400" />
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
              </CardContent>
            </Card>
          )}

          {/* Financial Metrics */}
          <Card>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Financial Metrics</h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentPrice)}</p>
                </div>

                {live_data && live_data.volume > 0 && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Trading Volume</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(live_data.volume)}</p>
                  </div>
                )}

                {equity?.eps && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100">
                    <p className="text-xs text-gray-500 mb-1">Earnings Per Share</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(equity.eps)}</p>
                  </div>
                )}

                {equity?.dps && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
                    <p className="text-xs text-gray-500 mb-1">Dividend Per Share</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(equity.dps)}</p>
                  </div>
                )}

                {equity?.shares && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Outstanding Shares</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(equity.shares)}</p>
                  </div>
                )}

                {equity?.capital && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Market Capitalization</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(equity.capital)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Board of Directors */}
        {equity?.company?.directors && equity.company.directors.length > 0 && (
          <Card>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Board of Directors</h2>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equity.company.directors.map((director, index) => (
                  <div
                    key={index}
                    className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {director.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight mb-1">
                          {director.name}
                        </p>
                        {director.position && (
                          <p className="text-xs text-gray-600 leading-tight">
                            {director.position}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};