import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Save, AlertTriangle, Euro, TrendingUp, Calculator, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

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
    { 
      key: 'budget_dichiarato' as ForecastColumnKey, 
      label: 'Budget Dichiarato', 
      description: 'Budget iniziale dichiarato per il cliente',
      icon: Calculator,
      color: 'blue' 
    },
    { 
      key: 'budget_attivo' as ForecastColumnKey, 
      label: 'Budget Attivo', 
      description: 'Budget attualmente attivo e utilizzabile',
      icon: TrendingUp,
      color: 'green' 
    },
    { 
      key: 'fast_rolling' as ForecastColumnKey, 
      label: 'Fast Rolling', 
      description: 'Previsione rapida basata sui trend attuali',
      icon: Euro,
      color: 'purple' 
    }
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
        newErrors[key] = 'Il valore è troppo grande (max 999.999.999)'
      }
    })

    // Validazione logica di business
    if (formData.budget_attivo > formData.budget_dichiarato && formData.budget_dichiarato > 0) {
      newErrors.budget_attivo = 'Il Budget Attivo non può essere maggiore del Budget Dichiarato'
    }

    // Validazione Fast Rolling (deve essere entro il 20% del Budget Attivo)
    if (formData.fast_rolling > 0 && formData.budget_attivo > 0) {
      const maxFastRolling = formData.budget_attivo * 1.2
      if (formData.fast_rolling > maxFastRolling) {
        newErrors.fast_rolling = `Il Fast Rolling non può superare il 120% del Budget Attivo (max €${formatNumber(maxFastRolling)})`
      }
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
    
    // Validazione in tempo reale
    setTimeout(() => validateForm(), 100)
  }

  const handleSave = async () => {
    if (!row || !validateForm()) {
      if (Object.keys(errors).length > 0) {
        toast.error('Correggi gli errori prima di salvare')
      }
      return
    }

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

      // Feedback di successo
      toast.success('Forecast aggiornato con successo!', {
        description: `${row.business_line_name} - ${row.client_name}`,
        duration: 3000
      })

      onClose()
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      setErrors({ general: 'Errore nel salvataggio. Riprova.' })
      toast.error('Errore nel salvataggio', {
        description: 'Si è verificato un errore. Riprova.'
      })
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

  // Funzione rimossa - ora usiamo design unificato

  if (!isOpen || !row) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Modifica Forecast
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {row.business_line_name} • {row.client_name}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center shadow-sm border border-slate-200"
              disabled={saving}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="px-8 py-6 space-y-8">
            {/* Error generale */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-red-800 font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-8">
              {forecastColumns.map((column, index) => {
                const Icon = column.icon
                const hasError = !!errors[column.key]
                const oldValue = row[column.key] || 0
                const newValue = formData[column.key]
                const hasChanged = oldValue !== newValue
                
                return (
                  <div key={column.key} className="group">
                    {/* Separatore tra sezioni */}
                    {index > 0 && <div className="border-t border-slate-100 -mt-4 mb-8" />}
                    
                    <div className="space-y-4">
                      {/* Header del campo */}
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          hasError 
                            ? 'bg-red-100' 
                            : column.color === 'blue' 
                              ? 'bg-blue-100' 
                              : column.color === 'green' 
                                ? 'bg-emerald-100' 
                                : 'bg-purple-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            hasError 
                              ? 'text-red-600' 
                              : column.color === 'blue' 
                                ? 'text-blue-600' 
                                : column.color === 'green' 
                                  ? 'text-emerald-600' 
                                  : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-lg font-semibold text-slate-900">
                            {column.label}
                          </label>
                          <p className="text-sm text-slate-600">
                            {column.description}
                          </p>
                        </div>
                        {hasChanged && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-slate-500 line-through">€{formatNumber(oldValue)}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-semibold text-emerald-600">€{formatNumber(newValue)}</span>
                          </div>
                        )}
                      </div>

                      {/* Input field */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Euro className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={formData[column.key]}
                          onChange={(e) => handleInputChange(column.key, e.target.value)}
                          className={`w-full pl-12 pr-6 py-4 border-2 rounded-xl text-xl font-semibold text-right transition-all duration-200 ${
                            hasError 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                              : hasChanged
                                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-emerald-50'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white hover:border-slate-300'
                          } placeholder:text-slate-400`}
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </div>

                      {/* Error message */}
                      {hasError && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <p className="text-sm font-medium">{errors[column.key]}</p>
                        </div>
                      )}

                      {/* Valore formattato */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Valore formattato:</span>
                        <span className="font-mono font-semibold text-slate-700">€{formatNumber(formData[column.key])}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="border-t border-slate-100 pt-8">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">Riepilogo Modifiche</h4>
                </div>
                
                <div className="space-y-3">
                  {forecastColumns.map(column => {
                    const oldValue = row[column.key] || 0
                    const newValue = formData[column.key]
                    const hasChanged = oldValue !== newValue
                    const difference = newValue - oldValue
                    const percentageChange = oldValue > 0 ? ((difference / oldValue) * 100) : 0
                    
                    return (
                      <div key={column.key} className={`flex justify-between items-center p-3 rounded-xl transition-all duration-200 ${
                        hasChanged ? 'bg-white border border-emerald-200 shadow-sm' : 'bg-slate-50/50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            hasChanged ? 'bg-emerald-100' : 'bg-slate-200'
                          }`}>
                            <column.icon className={`w-3 h-3 ${
                              hasChanged ? 'text-emerald-600' : 'text-slate-500'
                            }`} />
                          </div>
                          <span className={`font-medium ${
                            hasChanged ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {column.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className={hasChanged ? 'text-slate-500 text-sm line-through' : 'text-slate-900 font-semibold'}>
                                €{formatNumber(oldValue)}
                              </span>
                              {hasChanged && (
                                <>
                                  <span className="text-slate-400">→</span>
                                  <span className="font-semibold text-emerald-600">
                                    €{formatNumber(newValue)}
                                  </span>
                                </>
                              )}
                            </div>
                            {hasChanged && difference !== 0 && (
                              <div className="text-xs mt-1">
                                <span className={`font-medium ${
                                  difference > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {difference > 0 ? '+' : ''}€{formatNumber(Math.abs(difference))}
                                  {oldValue > 0 && (
                                    <span className="ml-1">({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Info modifiche */}
            <div className="flex items-center space-x-4">
              {Object.keys(errors).length > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {Object.keys(errors).length} errore{Object.keys(errors).length > 1 ? 'i' : ''} da correggere
                  </span>
                </div>
              )}
              
              {Object.keys(errors).length === 0 && (
                <div className="flex items-center space-x-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Pronto per il salvataggio</span>
                </div>
              )}
            </div>
            
            {/* Pulsanti azione */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-6 py-3 text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(errors).length > 0}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-3" />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}