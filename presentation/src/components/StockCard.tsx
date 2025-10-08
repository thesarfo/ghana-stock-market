import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type EquityLive } from '../types';
import { formatCurrency, formatNumber } from '../utils';
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

  const bgGradient = isPositive
    ? 'from-success-50 to-white'
    : isNegative
      ? 'from-danger-50 to-white'
      : 'from-gray-50 to-white';

  const changeColor = isPositive
    ? 'text-success-600'
    : isNegative
      ? 'text-danger-600'
      : 'text-gray-600';

  return (
    <div
      onClick={() => navigate(`/stock/${stock.name}`)}
      className={`
        bg-gradient-to-br ${bgGradient}
        border-2 ${borderColor}
        rounded-xl p-5
        cursor-pointer
        transition-all duration-200
        hover:shadow-lg hover:scale-[1.02]
        group
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
            {stock.name}
          </h3>
          <div className="flex items-center space-x-2">
            <TrendIcon className={`h-4 w-4 ${changeColor}`} />
            <span className={`text-sm font-semibold ${changeColor}`}>
              {isPositive && '+'}
              {stock.change.toFixed(2)}%
            </span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(stock.price)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Current Price</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Change</p>
          <p className={`text-sm font-semibold ${changeColor}`}>
            {isPositive && '+'}{formatCurrency(stock.change)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Volume</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatNumber(stock.volume)}
          </p>
        </div>
      </div>
    </div>
  );
};