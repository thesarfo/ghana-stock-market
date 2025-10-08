import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { type TimeSeriesPoint } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils';

interface PriceChartProps {
  data: TimeSeriesPoint[];
  symbol: string;
  type?: 'line' | 'area';
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  symbol,
  type = 'area',
  height = 300,
}) => {
  // Transform data for chart
  const chartData = data.map((point) => ({
    timestamp: new Date(point.timestamp).getTime(),
    price: point.value,
    volume: point.volume || 0,
    formattedTime: formatDateTime(point.timestamp),
  }));

  // Determine if overall trend is positive or negative
  const isPositiveTrend = data.length > 1 &&
    data[data.length - 1].value > data[0].value;

  const chartColor = isPositiveTrend ? '#22c55e' : '#ef4444'; // green or red
  const gradientId = `gradient-${symbol}`;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length)
    {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            {data.formattedTime}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(data.price)}
          </p>
          {data.volume > 0 && (
            <p className="text-sm text-gray-600">
              Volume: {data.volume.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom X-axis tick formatter
  const formatXAxisTick = (tickItem: any) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom Y-axis tick formatter
  const formatYAxisTick = (tickItem: number) => {
    return formatCurrency(tickItem);
  };

  if (data.length === 0)
  {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {symbol} Price Chart
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.length} data points
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxisTick}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxisTick}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: chartColor }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
