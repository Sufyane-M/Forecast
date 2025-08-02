import React from 'react'
import { AlertCircle, MessageSquare } from 'lucide-react'

interface ForecastCellProps {
  value: number | null
  status: 'empty' | 'wip' | 'confirmed' | 'error'
  hasComments: boolean
  hasErrors: boolean
  className?: string
}

export const ForecastCell: React.FC<ForecastCellProps> = ({
  value,
  status,
  hasComments,
  hasErrors,
  className = ''
}) => {
  const getCellColor = (): string => {
    return 'bg-white border-slate-200 text-slate-700'
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  // Status badge rimosso per design neutro

  return (
    <div className={`relative group transition-all duration-200 ${getCellColor()} border ${className}`}>
      <div className="flex items-center justify-center h-full px-4 py-3 min-h-[52px]">
        {/* Valore principale */}
        <span className="text-sm font-medium tabular-nums">
          {value ? formatNumber(value) : '—'}
        </span>
        
        {/* Indicatori di stato - visibili solo su hover o se attivi */}
        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {hasErrors && (
            <div className="flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
              <AlertCircle className="w-3 h-3 text-red-600" />
            </div>
          )}
          {hasComments && (
            <div className="flex items-center justify-center w-5 h-5 bg-purple-100 rounded-full">
              <MessageSquare className="w-3 h-3 text-purple-600" />
            </div>
          )}
        </div>
        
        {/* Indicatore di stato rimosso per design neutro */}
      </div>
      
      {/* Bordo di evidenziazione su hover */}
      <div className="absolute inset-0 border-2 border-blue-400 rounded opacity-0 group-hover:opacity-20 transition-opacity duration-200 pointer-events-none" />
    </div>
  )
}

export default ForecastCell