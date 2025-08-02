import React, { useState, useEffect } from 'react'
import { GitCompare, ArrowLeft, ArrowRight, Plus, Minus, Edit } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase } from '../lib/supabase'

interface ForecastVersion {
  id: string
  version_number: number
  version_name: string
  description?: string
  created_at: string
  created_by: string
  creator_name: string
}

interface ForecastDiffViewerProps {
  scenarioId: string
  onClose: () => void
}

interface DiffItem {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  id?: string
  business_line?: string
  client?: string
  month: number
  year: number
  amount_old?: number
  amount_new?: number
  status_old?: string
  status_new?: string
  notes_old?: string
  notes_new?: string
}

export const ForecastDiffViewer: React.FC<ForecastDiffViewerProps> = ({
  scenarioId,
  onClose
}) => {
  const [versions, setVersions] = useState<ForecastVersion[]>([])
  const [selectedVersion1, setSelectedVersion1] = useState<number | null>(null)
  const [selectedVersion2, setSelectedVersion2] = useState<number | null>(null)
  const [diffData, setDiffData] = useState<DiffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    loadVersions()
  }, [scenarioId])

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('forecast_versions')
        .select(`
          id,
          version_number,
          version_name,
          description,
          created_at,
          created_by,
          profiles!created_by(full_name)
        `)
        .eq('forecast_scenario_id', scenarioId)
        .order('version_number', { ascending: false })

      if (error) throw error

      const formattedVersions = data.map(v => ({
        ...v,
        creator_name: (v.profiles as any)?.full_name || 'Sconosciuto'
      }))

      setVersions(formattedVersions)
      
      // Seleziona automaticamente le ultime due versioni
      if (formattedVersions.length >= 2) {
        setSelectedVersion1(formattedVersions[1].version_number)
        setSelectedVersion2(formattedVersions[0].version_number)
      }
    } catch (error) {
      console.error('Errore nel caricamento delle versioni:', error)
    } finally {
      setLoading(false)
    }
  }

  const compareForecastVersions = async () => {
    if (!selectedVersion1 || !selectedVersion2) return

    setComparing(true)
    try {
      const { data, error } = await supabase.rpc('get_forecast_diff', {
        p_scenario_id: scenarioId,
        p_version_1: selectedVersion1,
        p_version_2: selectedVersion2
      })

      if (error) throw error

      // Processa i dati per creare il diff
      const data1 = data.data_1 || []
      const data2 = data.data_2 || []
      
      const diffItems = processDiffData(data1, data2)
      setDiffData(diffItems)
    } catch (error) {
      console.error('Errore nel confronto delle versioni:', error)
      alert('Errore nel confronto delle versioni')
    } finally {
      setComparing(false)
    }
  }

  const processDiffData = (data1: any[], data2: any[]): DiffItem[] => {
    const items: DiffItem[] = []
    const data1Map = new Map(data1.map(item => [item.id, item]))
    const data2Map = new Map(data2.map(item => [item.id, item]))

    // Trova elementi aggiunti e modificati
    data2.forEach(item2 => {
      const item1 = data1Map.get(item2.id)
      
      if (!item1) {
        // Elemento aggiunto
        items.push({
          type: 'added',
          id: item2.id,
          month: item2.month,
          year: item2.year,
          amount_new: item2.amount,
          status_new: item2.status,
          notes_new: item2.notes
        })
      } else {
        // Controlla se è stato modificato
        const isModified = 
          item1.amount !== item2.amount ||
          item1.status !== item2.status ||
          item1.notes !== item2.notes

        if (isModified) {
          items.push({
            type: 'modified',
            id: item2.id,
            month: item2.month,
            year: item2.year,
            amount_old: item1.amount,
            amount_new: item2.amount,
            status_old: item1.status,
            status_new: item2.status,
            notes_old: item1.notes,
            notes_new: item2.notes
          })
        }
      }
    })

    // Trova elementi rimossi
    data1.forEach(item1 => {
      if (!data2Map.has(item1.id)) {
        items.push({
          type: 'removed',
          id: item1.id,
          month: item1.month,
          year: item1.year,
          amount_old: item1.amount,
          status_old: item1.status,
          notes_old: item1.notes
        })
      }
    })

    return items.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  }

  const getDiffIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />
      case 'modified':
        return <Edit className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getDiffColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-green-200'
      case 'removed':
        return 'bg-red-50 border-red-200'
      case 'modified':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-6">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-center">Caricamento versioni...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-[#0D3F85]" />
              <h2 className="text-lg font-semibold text-[#333333]">
                Confronto Versioni Forecast
              </h2>
            </div>
            <Button onClick={onClose} variant="outline">
              Chiudi
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Versione 1 (precedente)
              </label>
              <select
                value={selectedVersion1 || ''}
                onChange={(e) => setSelectedVersion1(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleziona versione...</option>
                {versions.map(version => (
                  <option key={version.id} value={version.version_number}>
                    v{version.version_number} - {version.version_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Versione 2 (successiva)
              </label>
              <select
                value={selectedVersion2 || ''}
                onChange={(e) => setSelectedVersion2(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleziona versione...</option>
                {versions.map(version => (
                  <option key={version.id} value={version.version_number}>
                    v{version.version_number} - {version.version_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={compareForecastVersions}
            disabled={!selectedVersion1 || !selectedVersion2 || comparing}
            className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
          >
            {comparing ? 'Confronto in corso...' : 'Confronta Versioni'}
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {diffData.length === 0 && !comparing && (
            <div className="text-center py-8 text-[#333333]/60">
              <GitCompare className="h-12 w-12 mx-auto mb-4 text-[#333333]/40" />
              <p>Seleziona due versioni e clicca "Confronta Versioni" per vedere le differenze</p>
            </div>
          )}

          {comparing && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-[#333333]/60">Confronto in corso...</p>
            </div>
          )}

          {diffData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-[#333333]/60 mb-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  <span>Aggiunto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-600" />
                  <span>Rimosso</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>Modificato</span>
                </div>
              </div>

              {diffData.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getDiffColor(item.type)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getDiffIcon(item.type)}
                    <span className="font-medium text-[#333333]">
                      {item.month}/{item.year}
                    </span>
                    <span className="text-sm text-[#333333]/60">
                      ({item.type === 'added' ? 'Aggiunto' : 
                        item.type === 'removed' ? 'Rimosso' : 'Modificato'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {item.type === 'modified' && (
                      <>
                        <div>
                          <span className="text-[#333333]/60">Importo:</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-red-600">
                              {formatAmount(item.amount_old || 0)}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-green-600">
                              {formatAmount(item.amount_new || 0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[#333333]/60">Status:</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-red-600">
                              {item.status_old}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-green-600">
                              {item.status_new}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {item.type === 'added' && (
                      <>
                        <div>
                          <span className="text-[#333333]/60">Importo:</span>
                          <span className="ml-2 text-green-600">
                            {formatAmount(item.amount_new || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#333333]/60">Status:</span>
                          <span className="ml-2 text-green-600">
                            {item.status_new}
                          </span>
                        </div>
                      </>
                    )}

                    {item.type === 'removed' && (
                      <>
                        <div>
                          <span className="text-[#333333]/60">Importo:</span>
                          <span className="ml-2 text-red-600">
                            {formatAmount(item.amount_old || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#333333]/60">Status:</span>
                          <span className="ml-2 text-red-600">
                            {item.status_old}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}