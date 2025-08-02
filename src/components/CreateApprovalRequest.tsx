import React, { useState, useEffect } from 'react'
import { Send, User, Calendar, AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface Approver {
  id: string
  full_name: string
  email: string
}

interface CreateApprovalRequestProps {
  scenarioId: string
  scenarioName: string
  onSuccess: () => void
  onCancel: () => void
}

export const CreateApprovalRequest: React.FC<CreateApprovalRequestProps> = ({
  scenarioId,
  scenarioName,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuthStore()
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [selectedApproverId, setSelectedApproverId] = useState('')
  const [title, setTitle] = useState(`Approvazione Forecast: ${scenarioName}`)
  const [description, setDescription] = useState('')
  const [requestType, setRequestType] = useState('forecast_approval')
  const [priority, setPriority] = useState('normal')
  const [slaDays, setSlaDays] = useState(3)
  const [loading, setLoading] = useState(false)
  const [loadingApprovers, setLoadingApprovers] = useState(true)

  useEffect(() => {
    loadApprovers()
  }, [])

  const loadApprovers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['approver', 'admin'])
        .order('full_name')

      if (error) throw error
      setApprovers(data || [])
    } catch (error) {
      console.error('Errore nel caricamento degli approvatori:', error)
    } finally {
      setLoadingApprovers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedApproverId) {
      alert('Seleziona un approvatore')
      return
    }

    if (!title.trim()) {
      alert('Inserisci un titolo per la richiesta')
      return
    }

    setLoading(true)
    try {
      // Prima crea una versione del forecast corrente
      const { data: versionData, error: versionError } = await supabase.rpc('create_forecast_version', {
        p_scenario_id: scenarioId,
        p_created_by: user?.id,
        p_version_name: `Versione per approvazione - ${new Date().toLocaleDateString('it-IT')}`,
        p_description: 'Versione creata automaticamente per richiesta di approvazione'
      })

      if (versionError) throw versionError

      // Poi crea la richiesta di approvazione
      const { data: requestData, error: requestError } = await supabase.rpc('create_approval_request', {
        p_scenario_id: scenarioId,
        p_requester_id: user?.id,
        p_approver_id: selectedApproverId,
        p_title: title,
        p_description: description || null,
        p_request_type: requestType,
        p_priority: priority,
        p_sla_days: slaDays
      })

      if (requestError) throw requestError

      // Collega la versione alla richiesta
      if (versionData && requestData) {
        await supabase
          .from('forecast_versions')
          .update({ approval_request_id: requestData })
          .eq('id', versionData)
      }

      onSuccess()
    } catch (error) {
      console.error('Errore nella creazione della richiesta:', error)
      alert('Errore nella creazione della richiesta di approvazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Send className="h-5 w-5 text-[#0D3F85]" />
            <h2 className="text-lg font-semibold text-[#333333]">
              Crea Richiesta di Approvazione
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Scenario
              </label>
              <Input
                value={scenarioName}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Approvatore *
              </label>
              {loadingApprovers ? (
                <div className="text-sm text-[#333333]/60">Caricamento approvatori...</div>
              ) : (
                <select
                  value={selectedApproverId}
                  onChange={(e) => setSelectedApproverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                  required
                >
                  <option value="">Seleziona un approvatore...</option>
                  {approvers.map(approver => (
                    <option key={approver.id} value={approver.id}>
                      {approver.full_name} ({approver.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Titolo *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Inserisci il titolo della richiesta"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Descrizione
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                rows={3}
                placeholder="Descrivi i dettagli della richiesta (opzionale)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Tipo Richiesta
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                >
                  <option value="forecast_approval">Approvazione Forecast</option>
                  <option value="budget_change">Modifica Budget</option>
                  <option value="scenario_publish">Pubblicazione Scenario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Priorità
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                >
                  <option value="low">Bassa</option>
                  <option value="normal">Normale</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                SLA (giorni)
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#333333]/60" />
                <Input
                  type="number"
                  value={slaDays}
                  onChange={(e) => setSlaDays(Number(e.target.value))}
                  min={1}
                  max={30}
                  className="w-20"
                />
                <span className="text-sm text-[#333333]/60">
                  La richiesta scadrà il {new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>

            {priority === 'urgent' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Richiesta Urgente
                  </span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Le richieste urgenti invieranno notifiche immediate e reminder più frequenti.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !selectedApproverId}
                className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
              >
                {loading ? 'Invio in corso...' : 'Invia Richiesta'}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                disabled={loading}
              >
                Annulla
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}