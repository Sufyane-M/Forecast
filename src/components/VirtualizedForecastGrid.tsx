import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import debounce from 'lodash.debounce'
import { supabase } from '../lib/supabase'
import { ForecastCell } from './ForecastCell'
import { FloatingToolbar } from './FloatingToolbar'
import { useAutoSave } from '../hooks/useAutoSave'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MessageSquare,
  Edit3,
  Trash2
} from 'lucide-react'
import { z } from 'zod'

// Schema di validazione per le celle
const cellValueSchema = z.number().min(0, 'Il valore deve essere maggiore o uguale a 0')

interface ForecastRow {
  id: string
  scenario_id: string
  business_line_id: string
  business_line_name: string
  client_id: string
  client_name: string
  budget_dichiarato: number | null
  budget_attivo: number | null
  fast_rolling: number | null
  cell_status: {
    budget_dichiarato?: 'empty' | 'wip' | 'confirmed' | 'error'
    budget_attivo?: 'empty' | 'wip' | 'confirmed' | 'error'
    fast_rolling?: 'empty' | 'wip' | 'confirmed' | 'error'
  }
  validation_errors: any[]
  comments_count: number
  created_at: string
  updated_at: string
}

type ForecastColumnKey = 'budget_dichiarato' | 'budget_attivo' | 'fast_rolling'

interface Comment {
  id: string
  forecast_data_id: string
  column_name: string
  message: string
  author_id: string
  author_name: string
  created_at: string
  resolved: boolean
}

interface VirtualizedForecastGridProps {
  data: ForecastRow[]
  comments: Comment[]
  onDataChange: (data: ForecastRow[]) => void
  onOpenComments: (rowId: string, columnKey?: ForecastColumnKey) => void
  onOpenEdit: (row: ForecastRow) => void
  onDelete: (row: ForecastRow) => void
  scenarioId: string
}

interface CellEditState {
  rowId: string
  columnKey: ForecastColumnKey
  value: string
  isValid: boolean
  error?: string
}

interface FloatingToolbarState {
  visible: boolean
  x: number
  y: number
  selectedCells: Array<{ rowId: string; columnKey: ForecastColumnKey }>
}

const COLUMN_WIDTHS = {
  businessLine: 320,
  forecast: 180,
  actions: 140
}

const ROW_HEIGHT = 56
const HEADER_HEIGHT = 64

export const VirtualizedForecastGrid: React.FC<VirtualizedForecastGridProps> = ({
  data,
  comments,
  onDataChange,
  onOpenComments,
  onOpenEdit,
  onDelete,
  scenarioId
}) => {
  const [floatingToolbar, setFloatingToolbar] = useState<FloatingToolbarState>({
    visible: false,
    x: 0,
    y: 0,
    selectedCells: []
  })
  const [copiedValue, setCopiedValue] = useState<number | null>(null)
  
  // Hook per autosave
  const {
    saveStatus,
    pendingChangesCount,
    addChange,
    saveNow,
    hasUnsavedChanges,
    getTimeToNextSave
  } = useAutoSave<ForecastRow>('forecast_data', {
    delay: 30000, // 30 secondi
    onSaveSuccess: () => {
      // Ricarica i dati dopo il salvataggio per sincronizzare
      // onDataChange viene chiamato automaticamente dal hook
    }
  })
  
  const parentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  
  const forecastColumns = [
    { key: 'budget_dichiarato' as ForecastColumnKey, label: 'Budget Dichiarato' },
    { key: 'budget_attivo' as ForecastColumnKey, label: 'Budget Attivo' },
    { key: 'fast_rolling' as ForecastColumnKey, label: 'Fast Rolling' }
  ]

  // Virtualizzazione delle righe
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10
  })

  // Validazione RPC debounced
  const validateRow = useCallback(
    debounce(async (rowId: string, columnKey: ForecastColumnKey, value: number) => {
      try {
        const { data: validationResult, error } = await supabase
          .rpc('validate_row', {
            row_id: rowId,
            column_name: columnKey,
            new_value: value
          })

        if (error) throw error

        // Aggiorna lo stato di validazione
        const updatedData = data.map(row => {
          if (row.id === rowId) {
            return {
              ...row,
              cell_status: {
                ...row.cell_status,
                [columnKey]: validationResult.is_valid ? 'wip' : 'error'
              },
              validation_errors: validationResult.is_valid 
                ? row.validation_errors.filter(e => e.column !== columnKey)
                : [...row.validation_errors.filter(e => e.column !== columnKey), {
                    column: columnKey,
                    message: validationResult.error_message
                  }]
            }
          }
          return row
        })
        
        onDataChange(updatedData)
      } catch (error) {
        console.error('Errore nella validazione:', error)
      }
    }, 300),
    [data, onDataChange]
  )

  // Funzione per confermare una cella
  const confirmCell = useCallback(async (rowId: string, columnKey: ForecastColumnKey) => {
    try {
      const updatedData = data.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            cell_status: {
              ...row.cell_status,
              [columnKey]: 'confirmed'
            }
          }
        }
        return row
      })
      
      onDataChange(updatedData)
      
      // Salva immediatamente la conferma
      addChange(rowId, {
        cell_status: {
          ...data.find(r => r.id === rowId)?.cell_status,
          [columnKey]: 'confirmed'
        }
      })
      
      await saveNow()
    } catch (error) {
      console.error('Errore nella conferma:', error)
    }
  }, [data, onDataChange, addChange, saveNow])

  // Funzione per gestire la selezione delle celle (solo per toolbar)
  const handleCellSelection = (event: React.MouseEvent, rowId: string, columnKey: ForecastColumnKey) => {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setFloatingToolbar({
        visible: true,
        x: rect.right + 10,
        y: rect.top,
        selectedCells: [{ rowId, columnKey }]
      })
    }
  }

  // Color coding dinamico
  const getCellColor = (row: ForecastRow, columnKey: ForecastColumnKey): string => {
    const status = row.cell_status[columnKey] || 'empty'
    const hasComments = row.comments_count > 0
    const hasErrors = row.validation_errors.some(e => e.column === columnKey)
    
    if (hasErrors) return 'bg-red-50 border-red-300 text-red-900'
    if (hasComments) return 'bg-purple-50 border-purple-300 text-purple-900'
    
    switch (status) {
      case 'confirmed': return 'bg-green-50 border-green-300 text-green-900'
      case 'wip': return 'bg-yellow-50 border-yellow-300 text-yellow-900'
      case 'error': return 'bg-red-50 border-red-300 text-red-900'
      case 'empty': return 'bg-gray-50 border-gray-200 text-gray-600'
      default: return 'bg-white border-gray-200 text-gray-900'
    }
  }

  const handleCopy = () => {
    if (floatingToolbar.selectedCells.length === 0) return
    
    const { rowId, columnKey } = floatingToolbar.selectedCells[0]
    const row = data.find(r => r.id === rowId)
    if (row) {
      setCopiedValue(row[columnKey] || 0)
    }
    setFloatingToolbar({ ...floatingToolbar, visible: false })
  }

  const handlePaste = () => {
    if (copiedValue === null || floatingToolbar.selectedCells.length === 0) return
    
    const { rowId, columnKey } = floatingToolbar.selectedCells[0]
    // Aggiorna direttamente senza editing inline
    const updatedData = data.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          [columnKey]: copiedValue,
          cell_status: {
            ...row.cell_status,
            [columnKey]: copiedValue === 0 ? 'empty' : 'wip'
          }
        }
      }
      return row
    })
    
    onDataChange(updatedData)
    addChange(rowId, {
      [columnKey]: copiedValue,
      cell_status: {
        ...data.find(r => r.id === rowId)?.cell_status,
        [columnKey]: copiedValue === 0 ? 'empty' : 'wip'
      }
    })
    
    setFloatingToolbar({ ...floatingToolbar, visible: false })
  }

  const handleFillDown = () => {
    if (copiedValue === null || floatingToolbar.selectedCells.length === 0) return
    
    const { rowId, columnKey } = floatingToolbar.selectedCells[0]
    const startIndex = data.findIndex(r => r.id === rowId)
    
    // Riempi le celle successive con lo stesso valore
    const updatedData = data.map((row, index) => {
      if (index >= startIndex && index < startIndex + 5) { // Riempi 5 righe
        return {
          ...row,
          [columnKey]: copiedValue,
          cell_status: {
            ...row.cell_status,
            [columnKey]: copiedValue === 0 ? 'empty' : 'wip'
          }
        }
      }
      return row
    })
    
    onDataChange(updatedData)
    setFloatingToolbar({ ...floatingToolbar, visible: false })
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">


      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 shadow-sm" style={{ height: HEADER_HEIGHT }}>
        <div className="flex h-full">
          <div 
            className="flex items-center px-6 py-4 bg-slate-50/80 border-r border-slate-200 font-semibold text-slate-700 text-sm uppercase tracking-wide"
            style={{ width: COLUMN_WIDTHS.businessLine }}
          >
            <span>Business Line / Cliente</span>
          </div>
          {forecastColumns.map(column => (
            <div 
              key={column.key}
              className="flex items-center justify-center px-4 py-4 bg-slate-50/60 border-r border-slate-200 font-semibold text-slate-700 text-sm uppercase tracking-wide"
              style={{ width: COLUMN_WIDTHS.forecast }}
            >
              <div className="text-center">
                <div>{column.label}</div>
                <div className="text-xs text-slate-500 font-normal mt-1 normal-case">€ (migliaia)</div>
              </div>
            </div>
          ))}
          <div 
            className="flex items-center justify-center px-4 py-4 bg-slate-50/40 font-semibold text-slate-700 text-sm uppercase tracking-wide"
            style={{ width: COLUMN_WIDTHS.actions }}
          >
            Azioni
          </div>
        </div>
      </div>

      {/* Griglia virtualizzata */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          ref={gridRef}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = data[virtualRow.index]
            if (!row) return null

            return (
              <div
                key={row.id}
                className="absolute top-0 left-0 w-full flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150 group"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {/* Business Line / Cliente */}
                <div 
                  className="flex items-center px-6 py-3 border-r border-slate-200 bg-white sticky left-0 z-5 group-hover:bg-slate-50/50 transition-colors duration-150"
                  style={{ width: COLUMN_WIDTHS.businessLine }}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-800 mb-1">{row.business_line_name}</div>
                    <div className="text-xs text-slate-600 font-medium">{row.client_name}</div>
                  </div>
                </div>

                {/* Colonne forecast */}
                {forecastColumns.map(column => {
                  const value = row[column.key]
                  const status = row.cell_status[column.key] || 'empty'
                  const hasComments = comments.some(c => c.forecast_data_id === row.id && c.column_name === column.key)
                  const hasErrors = row.validation_errors.some(e => e.column === column.key)

                  return (
                    <div
                      key={column.key}
                      className="border-r border-slate-200"
                      style={{ width: COLUMN_WIDTHS.forecast }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        handleCellSelection(e, row.id, column.key)
                      }}
                    >
                      <ForecastCell
                        value={value}
                        status={status}
                        hasComments={hasComments}
                        hasErrors={hasErrors}
                        className="h-full"
                      />
                    </div>
                  )
                })}

                {/* Azioni */}
                <div 
                  className="flex items-center justify-center space-x-1 px-2 py-3"
                  style={{ width: COLUMN_WIDTHS.actions }}
                >
                  <button
                    onClick={() => onOpenComments(row.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105 text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                    title="Visualizza commenti"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenEdit(row)}
                    className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                    title="Modifica riga"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                    title="Elimina riga"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Toolbar flottante */}
      <FloatingToolbar
        visible={floatingToolbar.visible}
        x={floatingToolbar.x}
        y={floatingToolbar.y}
        selectedCellsCount={floatingToolbar.selectedCells.length}
        canPaste={copiedValue !== null}
        canFillDown={copiedValue !== null}
        onClose={() => setFloatingToolbar({ ...floatingToolbar, visible: false })}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onFillDown={handleFillDown}
        onSave={saveNow}
        onConfirm={() => {
          if (floatingToolbar.selectedCells.length > 0) {
            const { rowId, columnKey } = floatingToolbar.selectedCells[0]
            confirmCell(rowId, columnKey)
          }
        }}
        onMarkError={() => {
          if (floatingToolbar.selectedCells.length > 0) {
            const { rowId, columnKey } = floatingToolbar.selectedCells[0]
            // Logica per segnare come errore
            const updatedData = data.map(row => {
              if (row.id === rowId) {
                return {
                  ...row,
                  cell_status: {
                    ...row.cell_status,
                    [columnKey]: 'error'
                  }
                }
              }
              return row
            })
            onDataChange(updatedData)
            addChange(rowId, {
              cell_status: {
                ...data.find(r => r.id === rowId)?.cell_status,
                [columnKey]: 'error'
              }
            })
          }
        }}
      />

      {/* Footer con informazioni di stato */}
      <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-6 py-3 text-sm shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <span className="text-slate-700 font-medium">{data.length} righe totali</span>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <span className="text-amber-700 font-medium">
                  {pendingChangesCount} modifiche non salvate
                </span>
              </div>
            )}
            {saveStatus === 'saving' && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <span className="text-blue-700 font-medium">Salvataggio in corso...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="text-emerald-700 font-medium">Salvato</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <span className="text-red-700 font-medium">Errore nel salvataggio</span>
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {getTimeToNextSave() > 0 && (
              <span>Autosave tra {getTimeToNextSave()}s</span>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default VirtualizedForecastGrid