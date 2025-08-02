import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: ChartDataPoint[]
  title: string
  className?: string
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  title, 
  className = '' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-sm font-medium text-[#333333] mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-xs text-[#333333]/60 truncate">
              {item.label}
            </div>
            <div className="flex-1 relative">
              <div className="h-6 bg-gray-100 rounded-sm overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    item.color || 'bg-[#0D3F85]'
                  }`}
                  style={{ 
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
            <div className="w-16 text-xs text-[#333333] text-right font-medium">
              €{(item.value / 1000).toFixed(0)}k
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TrendIndicatorProps {
  value: number
  label: string
  trend: number
  className?: string
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  label,
  trend,
  className = ''
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatPercentage = (val: number) => {
    const sign = val > 0 ? '+' : ''
    return `${sign}${val.toFixed(1)}%`
  }

  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600'
    if (trendValue < 0) return 'text-[#C42024]'
    return 'text-[#333333]'
  }

  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown

  return (
    <div className={`p-4 bg-white rounded-lg border border-[#333333]/10 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#333333]/60 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#333333]">
            {formatCurrency(value)}
          </p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {formatPercentage(trend)}
            </span>
          </div>
          <p className="text-xs text-[#333333]/60 mt-1">
            vs mese precedente
          </p>
        </div>
      </div>
    </div>
  )
}

interface DonutChartProps {
  data: ChartDataPoint[]
  title: string
  centerValue?: string
  centerLabel?: string
  className?: string
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  centerValue,
  centerLabel,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  const colors = [
    '#0D3F85',
    '#4F46E5',
    '#7C3AED',
    '#EC4899',
    '#EF4444',
    '#F59E0B'
  ]

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-sm font-medium text-[#333333] mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="10"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage * 3.14} 314`
              const strokeDashoffset = -cumulativePercentage * 3.14
              cumulativePercentage += percentage
              
              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={item.color || colors[index % colors.length]}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          {(centerValue || centerLabel) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {centerValue && (
                <div className="text-lg font-bold text-[#333333]">
                  {centerValue}
                </div>
              )}
              {centerLabel && (
                <div className="text-xs text-[#333333]/60">
                  {centerLabel}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.color || colors[index % colors.length] 
                  }}
                />
                <div className="flex-1 text-xs text-[#333333]">
                  {item.label}
                </div>
                <div className="text-xs text-[#333333]/60">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}