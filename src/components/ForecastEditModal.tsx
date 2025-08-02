import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Save, AlertTriangle } from 'lucide-react'

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

interface ForecastEditModalProps {
  row: ForecastRow | null
  isOpen: boolean
  onClose: () => void
  onSave: (rowId: string, updates: Partial<ForecastRow>) => void
}

export const ForecastEditModal: React.FC<ForecastEditModalProps> = ({
  row,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    budget_dichiarato: 0,
    budget_attivo: 0,
    fast_rolling: 0
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const forecastColumns = [
    { key: 'budget_dichiarato' as ForecastColumnKey, label: 'Budget Dichiarato', color: 'blue' },
    { key: 'budget_attivo' as ForecastColumnKey, label: 'Budget Attivo', color: 'green' },
    { key: 'fast_rolling' as ForecastColumnKey, label: 'Fast Rolling', color: 'purple' }
  ]

  useEffect(() => {
    if (row && isOpen) {
      setFormData({
        budget_dichiarato: row.budget_dichiarato || 0,
        budget_attivo: row.budget_attivo || 0,
        fast_rolling: row.fast_rolling || 0
      })
      setErrors({})
    }
  }, [row, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validazione valori numerici
    Object.entries(formData).forEach(([key, value]) => {
      if (value < 0) {
        newErrors[key] = 'Il valore non può essere negativo'
      }
      if (value > 999999999) {
        newErrors[key] = 'Il valore è troppo grande'
      }
    })

    // Validazione logica di business
    if (formData.budget_attivo > formData.budget_dichiarato && formData.budget_dichiarato > 0) {
      newErrors.budget_attivo = 'Il Budget Attivo non può essere maggiore del Budget Dichiarato'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (column: ForecastColumnKey, value: string) => {
    const numericValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      [column]: numericValue
    }))
    
    // Rimuovi errore se presente
    if (errors[column]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[column]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    if (!row || !validateForm()) return

    try {
      setSaving(true)

      // Determina i nuovi status delle celle
      const newCellStatus = {
        ...row.cell_status,
        budget_dichiarato: formData.budget_dichiarato === 0 ? 'empty' : 'wip',
        budget_attivo: formData.budget_attivo === 0 ? 'empty' : 'wip',
        fast_rolling: formData.fast_rolling === 0 ? 'empty' : 'wip'
      }

      // Aggiorna nel database
      const { error } = await supabase
        .from('forecast_data')
        .update({
          budget_dichiarato: formData.budget_dichiarato,
          budget_attivo: formData.budget_attivo,
          fast_rolling: formData.fast_rolling,
          cell_status: newCellStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id)

      if (error) throw error

      // Notifica il componente padre
      onSave(row.id, {
        ...formData,
        cell_status: newCellStatus,
        updated_at: new Date().toISOString()
      })

      onClose()
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      setErrors({ general: 'Errore nel salvataggio. Riprova.' })
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getColumnColorClass = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 focus:border-blue-500 focus:ring-blue-500',
      green: 'border-green-200 focus:border-green-500 focus:ring-green-500',
      purple: 'border-purple-200 focus:border-purple-500 focus:ring-purple-500'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  if (!isOpen || !row) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Modifica Forecast
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {row.business_line_name} - {row.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error generale */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {forecastColumns.map(column => (
              <div key={column.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {column.label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData[column.key]}
                    onChange={(e) => handleInputChange(column.key, e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg text-lg font-medium text-right ${
                      errors[column.key] 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : getColumnColorClass(column.color)
                    } focus:ring-2 focus:ring-opacity-50`}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">€</span>
                  </div>
                </div>
                {errors[column.key] && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors[column.key]}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Valore formattato: €{formatNumber(formData[column.key])}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Riepilogo Modifiche</h4>
            <div className="space-y-2">
              {forecastColumns.map(column => {
                const oldValue = row[column.key] || 0
                const newValue = formData[column.key]
                const hasChanged = oldValue !== newValue
                
                return (
                  <div key={column.key} className="flex justify-between items-center text-sm">
                    <span className={hasChanged ? 'font-medium' : 'text-gray-600'}>
                      {column.label}:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={hasChanged ? 'line-through text-gray-400' : 'text-gray-900'}>
                        €{formatNumber(oldValue)}
                      </span>
                      {hasChanged && (
                        <>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-green-600">
                            €{formatNumber(newValue)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(errors).length > 0}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}