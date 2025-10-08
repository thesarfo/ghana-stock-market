import React from 'react';
import { type MarketSummary as MarketSummaryType } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui';
import { formatCurrency, formatNumber, formatLargeNumber, formatDateTime } from '../utils';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Building2 } from 'lucide-react';

interface MarketSummaryProps {
  summary: MarketSummaryType;
}

export const MarketSummary: React.FC<MarketSummaryProps> = ({ summary }) => {
  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              <span>Market Cap</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {formatLargeNumber(summary.total_market_cap)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              <span>Total Volume</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {formatLargeNumber(summary.total_volume)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              <span>Total Stocks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(summary.total_stocks)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Gainers and Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-success-600">
              <TrendingUp className="h-5 w-5" />
              <span>Top Gainers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.top_gainers.length > 0 ? (
                summary.top_gainers.map((stock) => (
                  <div key={stock.name} className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{stock.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(stock.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-success-600 font-medium">
                        +{formatCurrency(stock.change)}
                      </p>
                      <p className="text-xs text-success-600">
                        +{stock.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No gainers available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-danger-600">
              <TrendingDown className="h-5 w-5" />
              <span>Top Losers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.top_losers.length > 0 ? (
                summary.top_losers.map((stock) => (
                  <div key={stock.name} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{stock.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(stock.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-danger-600 font-medium">
                        {formatCurrency(stock.change)}
                      </p>
                      <p className="text-xs text-danger-600">
                        {stock.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No losers available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Last updated: {formatDateTime(summary.last_updated)}
        </p>
      </div>
    </div>
  );
};
