import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Copy,
  Edit3,
  Trash2,
  Filter,
  Search,
  X,
  Building2,
  User,
  CalendarDays
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface ForecastScenario {
  id: string
  name: string
  month: number
  year: number
  status: 'draft' | 'in_review_1' | 'in_review_2' | 'approved'
  completion_percentage?: number
  created_at: string
  updated_at: string
  created_by: string
  responsible_bl_user_id?: string
  cut_off_date?: string
  approved_at?: string
  approved_by?: string
}

interface BusinessLine {
  id: string
  code: string
  name: string
  responsible_user_id?: string
  is_active: boolean
}

interface CreateScenarioForm {
  name: string
  month: number
  year: number
  cutOffDate: string
  cloneFromScenario?: string
  businessLines: string[]
}

const statusConfig = {
  draft: {
    label: 'Bozza',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Edit3
  },
  in_review_1: {
    label: 'In Revisione L1',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock
  },
  in_review_2: {
    label: 'In Revisione L2',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: AlertCircle
  },
  approved: {
    label: 'Approvato',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  }
}

export const ForecastHub: React.FC = () => {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([])
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [deletingScenarios, setDeletingScenarios] = useState<Set<string>>(new Set())

  const [createForm, setCreateForm] = useState<CreateScenarioForm>({
    name: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    cutOffDate: '',
    cloneFromScenario: '',
    businessLines: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadScenarios(),
      loadBusinessLines()
    ])
  }

  const loadBusinessLines = async () => {
    try {
      const { data, error } = await supabase
        .from('business_lines')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBusinessLines(data || [])
    } catch (error) {
      console.error('Errore nel caricamento delle business line:', error)
    }
  }

  const loadScenarios = async () => {
    try {
      setLoading(true)
      
      // Carica scenari con calcolo percentuale completamento
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('forecast_scenarios')
        .select(`
          *,
          completion_stats:forecast_data(
            scenario_id,
            budget_dichiarato,
            budget_attivo,
            fast_rolling
          )
        `)
        .order('created_at', { ascending: false })

      if (scenariosError) throw scenariosError

      // Calcola percentuale completamento per ogni scenario
       const scenariosWithCompletion = await Promise.all(
         (scenariosData || []).map(async (scenario) => {
           try {
             const { data: completionData, error: completionError } = await supabase
               .rpc('calculate_scenario_completion', { scenario_id: scenario.id })

             if (completionError) {
               console.warn('Errore calcolo completamento per scenario', scenario.id, completionError)
               return {
                 ...scenario,
                 completion_percentage: 0
               }
             }

             return {
               ...scenario,
               completion_percentage: completionData || 0
             }
           } catch (error) {
             console.warn('Errore nel calcolo completamento:', error)
             return {
               ...scenario,
               completion_percentage: 0
             }
           }
         })
       )

      setScenarios(scenariosWithCompletion)
    } catch (error) {
      console.error('Errore nel caricamento degli scenari:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredScenarios = scenarios.filter(scenario => {
    const monthName = new Date(scenario.year, scenario.month - 1).toLocaleDateString('it-IT', { month: 'long' })
    const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         monthName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.year.toString().includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || scenario.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const createNewScenario = async () => {
    setShowCreateModal(true)
    // Pre-popola le business line attive
    setCreateForm(prev => ({
      ...prev,
      businessLines: businessLines.map(bl => bl.id)
    }))
  }

  const handleCreateScenario = async () => {
    if (!createForm.name.trim()) {
      alert('Inserisci un nome per lo scenario')
      return
    }

    if (createForm.businessLines.length === 0) {
      alert('Seleziona almeno una business line')
      return
    }

    try {
      setCreateLoading(true)

      // Verifica se esiste già uno scenario con lo stesso nome
      const { data: existingScenario } = await supabase
        .from('forecast_scenarios')
        .select('id')
        .eq('name', createForm.name.trim())
        .single()

      if (existingScenario) {
        alert('Esiste già uno scenario con questo nome')
        return
      }

      // Crea lo scenario
      const { data: newScenario, error: scenarioError } = await supabase
        .from('forecast_scenarios')
        .insert({
          name: createForm.name.trim(),
          month: createForm.month,
          year: createForm.year,
          status: 'draft',
          created_by: profile?.id,
          cut_off_date: createForm.cutOffDate || null,
          responsible_bl_user_id: businessLines.find(bl => createForm.businessLines.includes(bl.id))?.responsible_user_id
        })
        .select()
        .single()

      if (scenarioError) throw scenarioError

      // Se è stata selezionata la clonazione, copia i dati
      if (createForm.cloneFromScenario) {
        try {
          const { error: cloneError } = await supabase
            .rpc('clone_scenario_data', {
              source_scenario_id: createForm.cloneFromScenario,
              target_scenario_id: newScenario.id,
              selected_business_lines: createForm.businessLines
            })

          if (cloneError) {
            console.warn('Errore nella clonazione dei dati:', cloneError)
            alert('Scenario creato ma errore nella clonazione dei dati')
          }
        } catch (cloneErr) {
          console.warn('Errore nella clonazione:', cloneErr)
          alert('Scenario creato ma errore nella clonazione dei dati')
        }
      } else {
        // Crea struttura base per le business line selezionate
        try {
          const { error: initError } = await supabase
            .rpc('initialize_scenario_structure', {
              scenario_id: newScenario.id,
              business_line_ids: createForm.businessLines
            })

          if (initError) {
            console.warn('Errore nell\'inizializzazione della struttura:', initError)
            alert('Scenario creato ma errore nell\'inizializzazione della struttura')
          }
        } catch (initErr) {
          console.warn('Errore nell\'inizializzazione:', initErr)
          alert('Scenario creato ma errore nell\'inizializzazione della struttura')
        }
      }

      // Ricarica gli scenari
      await loadScenarios()
      
      // Mostra toast di successo
      toast.success('Scenario creato con successo', {
        description: `Lo scenario "${newScenario.name}" è stato creato e configurato.`
      })
      
      setShowCreateModal(false)
      resetCreateForm()

      // Naviga al nuovo scenario
      navigate(`/forecast/${newScenario.id}`)
    } catch (error) {
      console.error('Errore nella creazione dello scenario:', error)
      alert('Errore nella creazione dello scenario: ' + (error as Error).message)
    } finally {
      setCreateLoading(false)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      cutOffDate: '',
      cloneFromScenario: '',
      businessLines: businessLines.map(bl => bl.id)
    })
  }

  const cloneScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    setCreateForm({
      name: `${scenario.name} - Copia`,
      month: scenario.month,
      year: scenario.year,
      cutOffDate: '',
      cloneFromScenario: scenarioId,
      businessLines: businessLines.map(bl => bl.id)
    })
    setShowCreateModal(true)
  }

  const deleteScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    // Previeni doppi click
    if (deletingScenarios.has(scenarioId)) return

    if (!confirm(`Sei sicuro di voler eliminare lo scenario "${scenario.name}"?\n\nQuesta azione è irreversibile e eliminerà anche tutti i dati di forecast associati.`)) return
    
    try {
      // Aggiungi lo scenario alla lista di quelli in eliminazione
      setDeletingScenarios(prev => new Set(prev).add(scenarioId))
      
      const { error } = await supabase
        .from('forecast_scenarios')
        .delete()
        .eq('id', scenarioId)

      if (error) throw error
      
      // Rimuovi lo scenario dalla lista locale invece di ricaricare tutto
      setScenarios(prevScenarios => prevScenarios.filter(s => s.id !== scenarioId))
      
      // Mostra toast di successo
      toast.success('Scenario eliminato con successo', {
        description: `Lo scenario "${scenario.name}" è stato eliminato definitivamente.`
      })
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error)
      toast.error('Impossibile eliminare lo scenario', {
        description: 'Si è verificato un errore durante l\'eliminazione. Verifica i tuoi permessi e riprova.'
      })
    } finally {
      // Rimuovi lo scenario dalla lista di quelli in eliminazione
      setDeletingScenarios(prev => {
        const newSet = new Set(prev)
        newSet.delete(scenarioId)
        return newSet
      })
    }
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333333]/60">Caricamento scenari...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">Forecast Hub</h1>
              <p className="text-[#333333]/60 mt-1">Gestisci i tuoi scenari di forecast</p>
            </div>
            <Button 
              onClick={createNewScenario}
              className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Scenario
            </Button>
          </div>
        </div>
      </div>



      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit3 className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Bozze</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scenarios.filter(s => s.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Revisione</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scenarios.filter(s => s.status === 'in_review_1' || s.status === 'in_review_2').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Approvati</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scenarios.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Totale</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scenarios.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cerca per mese o anno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="draft">Bozza</option>
              <option value="in_review_1">In Revisione L1</option>
              <option value="in_review_2">In Revisione L2</option>
              <option value="approved">Approvato</option>
            </select>
          </div>
        </div>

        {/* Scenarios Grid */}
        {filteredScenarios.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333333] mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Nessun scenario trovato' : 'Nessuno scenario creato'}
              </h3>
              <p className="text-[#333333]/60 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia creando il tuo primo scenario di forecast'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button 
                  onClick={createNewScenario}
                  className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Primo Scenario
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((scenario) => {
              const StatusIcon = statusConfig[scenario.status].icon
              return (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-[#333333]">
                          {scenario.name}
                        </h3>
                        <p className="text-sm text-[#333333]/60">
                          {new Date(scenario.year, scenario.month - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                        </p>
                        {scenario.cut_off_date && (
                          <p className="text-xs text-[#333333]/60 mt-1">
                            Scadenza: {new Date(scenario.cut_off_date).toLocaleDateString('it-IT')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cloneScenario(scenario.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteScenario(scenario.id)}
                          disabled={deletingScenarios.has(scenario.id)}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingScenarios.has(scenario.id) ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mb-4 ${statusConfig[scenario.status].color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[scenario.status].label}
                    </div>

                    {/* Completion Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#333333]/60">Completamento</span>
                        <span className="font-medium text-[#333333]">{scenario.completion_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getCompletionColor(scenario.completion_percentage)}`}
                          style={{ width: `${scenario.completion_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-[#333333]/60 space-y-1">
                      <div>Creato: {new Date(scenario.created_at).toLocaleDateString('it-IT')}</div>
                      <div>Aggiornato: {new Date(scenario.updated_at).toLocaleDateString('it-IT')}</div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button 
                        className="w-full bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                        onClick={() => navigate(`/forecast/${scenario.id}`)}
                      >
                        Apri Scenario
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Scenario Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#333333]">
                  {createForm.cloneFromScenario ? 'Clona Scenario' : 'Crea Nuovo Scenario'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetCreateForm()
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Nome Scenario */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Nome Scenario *
                  </label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="es. Forecast Q1 2024"
                    className="w-full"
                  />
                </div>

                {/* Mese e Anno */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-2">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      Mese
                    </label>
                    <select
                      value={createForm.month}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1
                        const monthName = new Date(2024, i).toLocaleDateString('it-IT', { month: 'long' })
                        return (
                          <option key={month} value={month}>
                            {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-2">
                      Anno
                    </label>
                    <Input
                      type="number"
                      value={createForm.year}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Data di Scadenza */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Data di Scadenza (opzionale)
                  </label>
                  <Input
                    type="date"
                    value={createForm.cutOffDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, cutOffDate: e.target.value }))}
                    className="w-full"
                  />
                </div>

                {/* Clonazione */}
                {!createForm.cloneFromScenario && (
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-2">
                      Clona da Scenario Esistente (opzionale)
                    </label>
                    <select
                      value={createForm.cloneFromScenario}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, cloneFromScenario: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                    >
                      <option value="">Crea da zero</option>
                      {scenarios.filter(s => s.status === 'approved').map(scenario => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name} - {new Date(scenario.year, scenario.month - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Business Lines */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Business Lines da Includere
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {businessLines.map(bl => (
                      <label key={bl.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createForm.businessLines.includes(bl.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm(prev => ({
                                ...prev,
                                businessLines: [...prev.businessLines, bl.id]
                              }))
                            } else {
                              setCreateForm(prev => ({
                                ...prev,
                                businessLines: prev.businessLines.filter(id => id !== bl.id)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-[#0D3F85] focus:ring-[#0D3F85]"
                        />
                        <span className="text-sm text-[#333333]">
                          {bl.code} - {bl.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[#333333]/60 mt-1">
                    Seleziona le business line da includere nel forecast
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button 
                  onClick={() => {
                    setShowCreateModal(false)
                    resetCreateForm()
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={createLoading}
                >
                  Annulla
                </Button>
                <Button 
                  onClick={handleCreateScenario}
                  className="flex-1 bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                  disabled={createLoading || !createForm.name.trim() || createForm.businessLines.length === 0}
                >
                  {createLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  {createForm.cloneFromScenario ? 'Clona Scenario' : 'Crea Scenario'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}