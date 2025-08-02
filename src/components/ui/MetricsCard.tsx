import React from 'react'
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react'

interface MetricProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  status?: 'positive' | 'negative' | 'neutral' | 'warning'
  className?: string
}

export const MetricCard: React.FC<MetricProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs periodo precedente',
  icon,
  status = 'neutral',
  className = ''
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `€${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `€${(val / 1000).toFixed(0)}k`
      } else {
        return `€${val.toFixed(0)}`
      }
    }
    return val
  }

  const getStatusColor = () => {
    switch (status) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-[#C42024]'
      case 'warning':
        return 'text-orange-500'
      default:
        return 'text-[#333333]'
    }
  }

  const getChangeColor = () => {
    if (change === undefined) return 'text-[#333333]/60'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-[#C42024]'
    return 'text-[#333333]/60'
  }

  const getChangeIcon = () => {
    if (change === undefined) return null
    return change > 0 ? TrendingUp : TrendingDown
  }

  const ChangeIcon = getChangeIcon()

  return (
    <div className={`bg-white rounded-lg border border-[#333333]/10 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <div className={getStatusColor()}>
                {icon}
              </div>
            )}
            <p className="text-sm font-medium text-[#333333]/60">
              {title}
            </p>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor()}`}>
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${getChangeColor()}`}>
              {ChangeIcon && <ChangeIcon className="h-3 w-3" />}
              <span className="text-xs font-medium">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-[#333333]/60">
                {changeLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MetricsGridProps {
  metrics: Array<{
    id: string
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon?: React.ReactNode
    status?: 'positive' | 'negative' | 'neutral' | 'warning'
  }>
  className?: string
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ 
  metrics, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeLabel={metric.changeLabel}
          icon={metric.icon}
          status={metric.status}
        />
      ))}
    </div>
  )
}

interface StatusIndicatorProps {
  status: 'online' | 'updating' | 'error' | 'offline'
  label?: string
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'Online',
          animation: 'animate-pulse'
        }
      case 'updating':
        return {
          color: 'bg-blue-500',
          text: 'Aggiornamento',
          animation: 'animate-pulse'
        }
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'Errore',
          animation: ''
        }
      case 'offline':
        return {
          color: 'bg-gray-400',
          text: 'Offline',
          animation: ''
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.animation}`} />
      <span className="text-xs text-[#333333]/60">
        {label || config.text}
      </span>
    </div>
  )
}