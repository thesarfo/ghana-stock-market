import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type EquityLive } from '../types';
import { formatCurrency, formatNumber, cn } from '../utils';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface StockCardProps {
  stock: EquityLive;
}

export const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const navigate = useNavigate();
  const isPositive = stock.change > 0;
  const isNegative = stock.change < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const borderColor = isPositive
    ? 'border-success-200'
    : isNegative
      ? 'border-danger-200'
      : 'border-gray-200';

  const bgColor = isPositive
    ? 'bg-success-50'
    : isNegative
      ? 'bg-danger-50'
      : 'bg-gray-50';

  const changeColor = isPositive
    ? 'text-success-600'
    : isNegative
      ? 'text-danger-600'
      : 'text-gray-600';

  return (
    <div
      onClick={() => navigate(`/stock/${stock.name}`)}
      className={cn(
        bgColor,
        'border-2',
        borderColor,
        'rounded-xl p-5 cursor-pointer transition-opacity duration-150 hover:opacity-90 group'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 text-balance">
            {stock.name}
          </h3>
          <div className="flex items-center space-x-2">
            <TrendIcon className={cn('size-4', changeColor)} />
            <span className={cn('text-sm font-semibold tabular-nums', changeColor)}>
              {isPositive && '+'}
              {stock.change.toFixed(2)}%
            </span>
          </div>
        </div>
        <ArrowRight className="size-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-transform duration-150" />
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {formatCurrency(stock.price)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Current Price</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Change</p>
          <p className={cn('text-sm font-semibold tabular-nums', changeColor)}>
            {isPositive && '+'}{formatCurrency(stock.change)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Volume</p>
          <p className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatNumber(stock.volume)}
          </p>
        </div>
      </div>
    </div>
  );
};