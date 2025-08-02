import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CommentsPanel } from '../components/CommentsPanel'
import { ForecastEditModal } from '../components/ForecastEditModal'
import { VirtualizedForecastGrid } from '../components/VirtualizedForecastGrid'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  Download, 
  Save, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare,
  Edit3,
  Plus,
  X,
  AlertTriangle,
  Trash2
} from 'lucide-react'

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

interface BusinessLine {
  id: string
  code: string
  name: string
}

interface Client {
  id: string
  name: string
}

type ForecastColumnKey = 'budget_dichiarato' | 'budget_attivo' | 'fast_rolling'

export const ForecastSheet: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  
  // Colonne del forecast
  const forecastColumns = [
    { key: 'budget_dichiarato' as ForecastColumnKey, label: 'Budget Dichiarato' },
    { key: 'budget_attivo' as ForecastColumnKey, label: 'Budget Attivo' },
    { key: 'fast_rolling' as ForecastColumnKey, label: 'Fast Rolling' }
  ]

  // Stati
  const [data, setData] = useState<ForecastRow[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBusinessLine, setSelectedBusinessLine] = useState('all')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [scenarioInfo, setScenarioInfo] = useState<{ name: string; month: number; year: number } | null>(null)
  const [showAddRowForm, setShowAddRowForm] = useState(false)
  const [newRowData, setNewRowData] = useState({ businessLineId: '', clientId: '' })
  
  // Stati per commenti e modifica modale
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)
  const [selectedRowForComments, setSelectedRowForComments] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRowForEdit, setSelectedRowForEdit] = useState<ForecastRow | null>(null)
  
  // Stati per eliminazione
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRowForDelete, setSelectedRowForDelete] = useState<ForecastRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (scenarioId) {
      loadData()
    }
  }, [scenarioId])

  const loadData = async () => {
    // Carica prima le informazioni di base
    await Promise.all([
      loadScenarioInfo(),
      loadBusinessLines(),
      loadClients(),
      loadForecastData()
    ])
    
    // Poi carica i commenti (che dipendono dai dati del forecast)
    await loadComments()
  }

  const loadScenarioInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('forecast_scenarios')
        .select('name, month, year')
        .eq('id', scenarioId)
        .single()

      if (error) throw error
      setScenarioInfo(data)
    } catch (error) {
      console.error('Errore nel caricamento info scenario:', error)
    }
  }

  const loadBusinessLines = async () => {
    try {
      const { data, error } = await supabase
        .from('business_lines')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBusinessLines(data || [])
    } catch (error) {
      console.error('Errore nel caricamento business lines:', error)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error)
    }
  }

  const loadForecastData = async () => {
    try {
      setLoading(true)
      const { data: forecastData, error } = await supabase
        .from('forecast_data')
        .select(`
          *,
          business_lines!inner(id, code, name),
          clients!inner(id, name)
        `)
        .eq('scenario_id', scenarioId)
        .order('business_lines(name)')
        .order('clients(name)')

      if (error) throw error
      
      const processedData = (forecastData || []).map(row => ({
        id: row.id,
        scenario_id: row.scenario_id,
        business_line_id: row.business_line_id,
        business_line_name: row.business_lines.name,
        client_id: row.client_id,
        client_name: row.clients.name,
        budget_dichiarato: row.budget_dichiarato,
        budget_attivo: row.budget_attivo,
        fast_rolling: row.fast_rolling,
        cell_status: row.cell_status || {},
        validation_errors: row.validation_errors || [],
        comments_count: 0, // Sarà aggiornato con i commenti
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
      
      setData(processedData)
      
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    if (data.length === 0) return
    
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!author_id(
            id,
            full_name
          )
        `)
        .in('forecast_data_id', data.map(row => row.id))
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const processedComments = (commentsData || []).map(comment => ({
        id: comment.id,
        forecast_data_id: comment.forecast_data_id,
        column_name: comment.column_name || '',
        message: comment.content || '',
        author_id: comment.author_id,
        author_name: comment.author?.full_name || 'Utente',
        created_at: comment.created_at,
        resolved: comment.is_resolved || false
      }))
      
      setComments(processedComments)
      
      // Aggiorna il conteggio dei commenti per ogni riga
      setData(prevData => 
        prevData.map(row => ({
          ...row,
          comments_count: processedComments.filter(c => c.forecast_data_id === row.id).length
        }))
      )
    } catch (error) {
      console.error('Errore nel caricamento dei commenti:', error)
    }
  }

  const getCellStatus = (row: ForecastRow, column: ForecastColumnKey): 'empty' | 'wip' | 'confirmed' | 'error' => {
    return row.cell_status[column] || 'empty'
  }

  const getCellValue = (row: ForecastRow, column: ForecastColumnKey): number => {
    return row[column] || 0
  }

  const hasValidationErrors = (row: ForecastRow, column: ForecastColumnKey): boolean => {
    return row.validation_errors.some(error => error.column === column)
  }

  const updateCell = async (rowId: string, column: ForecastColumnKey, value: number) => {
    try {
      setSaving(true)
      
      // Determina il nuovo status della cella
      const newCellStatus = value === 0 ? 'empty' : 'wip'
      
      // Aggiorna localmente
      setData(prevData => 
        prevData.map(row => {
          if (row.id === rowId) {
            const updatedRow = { 
              ...row, 
              [column]: value,
              cell_status: {
                ...row.cell_status,
                [column]: newCellStatus
              }
            }
            return updatedRow
          }
          return row
        })
      )

      // Salva nel database
      const { error } = await supabase
        .from('forecast_data')
        .update({ 
          [column]: value, 
          cell_status: {
            ...data.find(row => row.id === rowId)?.cell_status,
            [column]: newCellStatus
          },
          updated_at: new Date().toISOString() 
        })
        .eq('id', rowId)

      if (error) throw error
      
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
      // Ricarica i dati in caso di errore
      loadForecastData()
    } finally {
      setSaving(false)
    }
  }

  const toggleGroup = (businessLineId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(businessLineId)) {
        newSet.delete(businessLineId)
      } else {
        newSet.add(businessLineId)
      }
      return newSet
    })
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getCellColor = (status: 'empty' | 'wip' | 'confirmed' | 'error', hasComments: boolean, hasErrors: boolean): string => {
    if (hasErrors) return 'bg-red-50 border-red-300'
    if (hasComments) return 'bg-blue-50 border-blue-200'
    
    switch (status) {
      case 'confirmed': return 'bg-green-50 border-green-200'
      case 'wip': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'empty': return 'bg-gray-50 border-gray-200'
      default: return 'bg-white border-gray-200'
    }
  }



  const handleAddRow = () => {
    setShowAddRowForm(true)
    setNewRowData({ businessLineId: '', clientId: '' })
  }

  const handleSaveNewRow = async () => {
    if (!newRowData.businessLineId || !newRowData.clientId) {
      alert('Seleziona sia la Business Line che il Cliente')
      return
    }

    // Verifica se la combinazione esiste già
    const existingRow = data.find(row => 
      row.business_line_id === newRowData.businessLineId && 
      row.client_id === newRowData.clientId
    )

    if (existingRow) {
      alert('Questa combinazione Business Line/Cliente esiste già')
      return
    }

    try {
      setSaving(true)
      
      const { data: insertedData, error } = await supabase
        .from('forecast_data')
        .insert({
          scenario_id: scenarioId,
          business_line_id: newRowData.businessLineId,
          client_id: newRowData.clientId,
          budget_dichiarato: 0,
          budget_attivo: 0,
          fast_rolling: 0,
          cell_status: {},
          validation_errors: []
        })
        .select(`
          *,
          business_lines!inner(id, code, name),
          clients!inner(id, name)
        `)
        .single()

      if (error) throw error

      // Aggiungi la nuova riga ai dati locali
      const newRow: ForecastRow = {
        id: insertedData.id,
        scenario_id: insertedData.scenario_id,
        business_line_id: insertedData.business_line_id,
        business_line_name: insertedData.business_lines.name,
        client_id: insertedData.client_id,
        client_name: insertedData.clients.name,
        budget_dichiarato: insertedData.budget_dichiarato,
        budget_attivo: insertedData.budget_attivo,
        fast_rolling: insertedData.fast_rolling,
        cell_status: insertedData.cell_status || {},
        validation_errors: insertedData.validation_errors || [],
        comments_count: 0,
        created_at: insertedData.created_at,
        updated_at: insertedData.updated_at
      }

      setData(prevData => [...prevData, newRow])
      setShowAddRowForm(false)
      setNewRowData({ businessLineId: '', clientId: '' })
      
    } catch (error) {
      console.error('Errore nell\'aggiunta della riga:', error)
      alert('Errore nell\'aggiunta della riga')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelNewRow = () => {
    setShowAddRowForm(false)
    setNewRowData({ businessLineId: '', clientId: '' })
  }

  // Funzioni per gestire i commenti
  const handleOpenComments = (rowId: string, columnKey?: ForecastColumnKey) => {
    setSelectedRowForComments(rowId)
    setShowCommentsPanel(true)
  }

  const handleCloseComments = () => {
    setShowCommentsPanel(false)
    setSelectedRowForComments(null)
    // Ricarica i commenti per aggiornare il conteggio
    loadComments()
  }

  // Funzioni per gestire la modifica modale
  const handleOpenEditModal = (row: ForecastRow) => {
    setSelectedRowForEdit(row)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedRowForEdit(null)
  }

  const handleSaveEditModal = (rowId: string, updates: Partial<ForecastRow>) => {
    // Aggiorna i dati localmente
    setData(prevData => 
      prevData.map(row => 
        row.id === rowId 
          ? { ...row, ...updates }
          : row
      )
    )
  }

  // Funzioni per gestire l'eliminazione
  const handleOpenDeleteModal = (row: ForecastRow) => {
    setSelectedRowForDelete(row)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setSelectedRowForDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedRowForDelete) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('forecast_data')
        .delete()
        .eq('id', selectedRowForDelete.id)

      if (error) throw error

      // Rimuovi la riga dai dati locali
      setData(prevData => prevData.filter(row => row.id !== selectedRowForDelete.id))
      
      // Mostra toast di successo
      toast.success(`Forecast eliminato con successo`, {
        description: `${selectedRowForDelete.business_line_name} - ${selectedRowForDelete.client_name}`
      })
      
      handleCloseDeleteModal()
    } catch (error) {
      console.error('Errore nell\'eliminazione del forecast:', error)
      toast.error('Impossibile eliminare il forecast', {
        description: 'Si è verificato un errore durante l\'eliminazione. Riprova.'
      })
    } finally {
      setDeleting(false)
    }
  }

  const filteredData = data.filter(row => {
    const matchesSearch = row.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.business_line_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBusinessLine = selectedBusinessLine === 'all' || row.business_line_id === selectedBusinessLine
    return matchesSearch && matchesBusinessLine
  })

  const groupedData = filteredData.reduce((groups, row) => {
    const key = `${row.business_line_id}|${row.business_line_name}`
    const group = groups[key] || []
    group.push(row)
    groups[key] = group
    return groups
  }, {} as Record<string, ForecastRow[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {scenarioInfo ? `${scenarioInfo.name} - ${scenarioInfo.month}/${scenarioInfo.year}` : 'Foglio Forecast'}
              </h1>
              <p className="text-gray-600 mt-1">Gestisci i dati del forecast per scenario</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleAddRow}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Riga
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Esporta
              </button>
              <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                <Save className="h-4 w-4 mr-2" />
                Salva
              </button>
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cerca per cliente o business line..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={selectedBusinessLine}
              onChange={(e) => setSelectedBusinessLine(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutte le Business Line</option>
              {businessLines.map(bl => (
                <option key={bl.id} value={bl.id}>{bl.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Griglia Virtualizzata */}
        {filteredData.length > 0 ? (
          <div className="h-[600px]">
            <VirtualizedForecastGrid
              data={filteredData}
              comments={comments}
              onDataChange={setData}
              onOpenComments={handleOpenComments}
              onOpenEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              scenarioId={scenarioId || ''}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun dato trovato</h3>
            <p className="text-gray-600">
              {searchTerm || selectedBusinessLine !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Aggiungi nuove righe per iniziare'
              }
            </p>
          </div>
        )}
      </div>

      {/* Form per aggiungere nuova riga */}
      {showAddRowForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Aggiungi Nuova Riga</h3>
              <button
                onClick={handleCancelNewRow}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Line
                </label>
                <select
                  value={newRowData.businessLineId}
                  onChange={(e) => setNewRowData(prev => ({ ...prev, businessLineId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleziona Business Line</option>
                  {businessLines.map(bl => (
                    <option key={bl.id} value={bl.id}>{bl.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={newRowData.clientId}
                  onChange={(e) => setNewRowData(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleziona Cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelNewRow}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveNewRow}
                disabled={saving || !newRowData.businessLineId || !newRowData.clientId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvataggio...' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Panel */}
      <CommentsPanel
        forecastDataId={selectedRowForComments || ''}
        isOpen={showCommentsPanel}
        onClose={handleCloseComments}
      />

      {/* Edit Modal */}
      <ForecastEditModal
        row={selectedRowForEdit}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditModal}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRowForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Elimina Forecast</h3>
                  <p className="text-sm text-slate-600">Questa azione non è reversibile</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-slate-700">
                  Sei sicuro di voler eliminare questo forecast?
                </p>
                
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-600">Business Line:</span>
                      <span className="text-sm text-slate-900">{selectedRowForDelete.business_line_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-600">Cliente:</span>
                      <span className="text-sm text-slate-900">{selectedRowForDelete.client_name}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Attenzione</p>
                      <p className="text-sm text-red-700 mt-1">
                        Tutti i dati associati a questo forecast, inclusi commenti e cronologia, verranno eliminati definitivamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseDeleteModal}
                  disabled={deleting}
                  className="px-6 py-3 text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      Eliminazione...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-3" />
                      Elimina Definitivamente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForecastSheet