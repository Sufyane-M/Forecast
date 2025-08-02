import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'

interface ApprovalRequest {
  id: string
  scenario_id: string
  scenario_name: string
  business_line: string
  submitted_by: string
  submitted_at: string
  status: 'pending' | 'approved' | 'rejected'
  level: 1 | 2 // 1 = BL Manager, 2 = CFO
  due_date: string
  notes?: string
  reviewer_id?: string
  reviewed_at?: string
  changes_summary: {
    total_changes: number
    major_changes: number
    affected_clients: string[]
  }
}

interface DiffItem {
  client: string
  month: string
  old_value: number
  new_value: number
  change_percentage: number
}

const statusConfig = {
  pending: {
    label: 'In Attesa',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock
  },
  approved: {
    label: 'Approvato',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  rejected: {
    label: 'Respinto',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  }
}

export const Approvals: React.FC = () => {
  const { profile } = useAuthStore()
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [diffData, setDiffData] = useState<DiffItem[]>([])
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    try {
      setLoading(true)
      // Simulated data - in real app would come from Supabase
      const mockApprovals: ApprovalRequest[] = [
        {
          id: '1',
          scenario_id: 'scenario-1',
          scenario_name: 'Gennaio 2024',
          business_line: 'Consulting',
          submitted_by: 'Mario Rossi',
          submitted_at: '2024-01-15T10:30:00Z',
          status: 'pending',
          level: 1,
          due_date: '2024-01-18T23:59:59Z',
          changes_summary: {
            total_changes: 15,
            major_changes: 3,
            affected_clients: ['Cliente A', 'Cliente B', 'Cliente C']
          }
        },
        {
          id: '2',
          scenario_id: 'scenario-2',
          scenario_name: 'Febbraio 2024',
          business_line: 'Development',
          submitted_by: 'Laura Bianchi',
          submitted_at: '2024-01-14T14:20:00Z',
          status: 'pending',
          level: 2,
          due_date: '2024-01-17T23:59:59Z',
          changes_summary: {
            total_changes: 8,
            major_changes: 1,
            affected_clients: ['Cliente D', 'Cliente E']
          }
        },
        {
          id: '3',
          scenario_id: 'scenario-3',
          scenario_name: 'Dicembre 2023',
          business_line: 'Consulting',
          submitted_by: 'Marco Verdi',
          submitted_at: '2024-01-10T09:15:00Z',
          status: 'approved',
          level: 2,
          due_date: '2024-01-13T23:59:59Z',
          reviewer_id: profile?.id,
          reviewed_at: '2024-01-12T16:45:00Z',
          notes: 'Approvato con modifiche minori',
          changes_summary: {
            total_changes: 5,
            major_changes: 0,
            affected_clients: ['Cliente F']
          }
        }
      ]
      
      setApprovals(mockApprovals)
    } catch (error) {
      console.error('Errore nel caricamento delle approvazioni:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDiffData = async (approvalId: string) => {
    try {
      // Simulated diff data
      const mockDiff: DiffItem[] = [
        {
          client: 'Cliente A',
          month: 'Gennaio',
          old_value: 50000,
          new_value: 55000,
          change_percentage: 10
        },
        {
          client: 'Cliente B',
          month: 'Febbraio',
          old_value: 30000,
          new_value: 25000,
          change_percentage: -16.67
        },
        {
          client: 'Cliente C',
          month: 'Marzo',
          old_value: 0,
          new_value: 40000,
          change_percentage: 100
        }
      ]
      
      setDiffData(mockDiff)
    } catch (error) {
      console.error('Errore nel caricamento delle differenze:', error)
    }
  }

  const handleApprove = async (approvalId: string) => {
    try {
      // Update approval status
      const updatedApprovals = approvals.map(approval => 
        approval.id === approvalId 
          ? { 
              ...approval, 
              status: 'approved' as const,
              reviewer_id: profile?.id,
              reviewed_at: new Date().toISOString(),
              notes: reviewNotes
            }
          : approval
      )
      
      setApprovals(updatedApprovals)
      setSelectedApproval(null)
      setReviewNotes('')
      
      // In real app, would update Supabase
      console.log('Approvazione confermata per:', approvalId)
    } catch (error) {
      console.error('Errore nell\'approvazione:', error)
    }
  }

  const handleReject = async (approvalId: string) => {
    if (!reviewNotes.trim()) {
      alert('Inserisci una nota per il rifiuto')
      return
    }
    
    try {
      const updatedApprovals = approvals.map(approval => 
        approval.id === approvalId 
          ? { 
              ...approval, 
              status: 'rejected' as const,
              reviewer_id: profile?.id,
              reviewed_at: new Date().toISOString(),
              notes: reviewNotes
            }
          : approval
      )
      
      setApprovals(updatedApprovals)
      setSelectedApproval(null)
      setReviewNotes('')
      
      console.log('Approvazione respinta per:', approvalId)
    } catch (error) {
      console.error('Errore nel rifiuto:', error)
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status !== 'pending') return 'text-[#333333]/60'
    
    const days = getDaysUntilDue(dueDate)
    if (days < 0) return 'text-red-600'
    if (days <= 1) return 'text-orange-600'
    return 'text-[#333333]/60'
  }

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.scenario_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.business_line.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.submitted_by.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333333]/60">Caricamento approvazioni...</p>
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
              <h1 className="text-2xl font-bold text-[#333333]">Approvazioni</h1>
              <p className="text-[#333333]/60 mt-1">Gestisci le richieste di approvazione forecast</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-[#333333]/60">
                {filteredApprovals.filter(a => a.status === 'pending').length} in attesa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cerca per scenario, business line o utente..."
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
              <option value="pending">In Attesa</option>
              <option value="approved">Approvati</option>
              <option value="rejected">Respinti</option>
            </select>
          </div>
        </div>

        {/* Approvals List */}
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333333] mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Nessuna approvazione trovata' : 'Nessuna approvazione pendente'}
              </h3>
              <p className="text-[#333333]/60">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Tutte le approvazioni sono state gestite'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApprovals.map((approval) => {
              const StatusIcon = statusConfig[approval.status].icon
              const daysUntilDue = getDaysUntilDue(approval.due_date)
              
              return (
                <Card key={approval.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-[#333333]">
                            {approval.scenario_name}
                          </h3>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[approval.status].color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[approval.status].label}
                          </div>
                          <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Livello {approval.level}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-[#333333]/60">Business Line</div>
                            <div className="font-medium text-[#333333]">{approval.business_line}</div>
                          </div>
                          <div>
                            <div className="text-sm text-[#333333]/60">Inviato da</div>
                            <div className="font-medium text-[#333333] flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {approval.submitted_by}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-[#333333]/60">Scadenza</div>
                            <div className={`font-medium flex items-center ${getDueDateColor(approval.due_date, approval.status)}`}>
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(approval.due_date).toLocaleDateString('it-IT')}
                              {approval.status === 'pending' && (
                                <span className="ml-2 text-xs">
                                  ({daysUntilDue > 0 ? `${daysUntilDue} giorni` : 'Scaduto'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Changes Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="text-sm font-medium text-[#333333] mb-2">Riepilogo Modifiche</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-[#333333]/60">Modifiche totali: </span>
                              <span className="font-medium">{approval.changes_summary.total_changes}</span>
                            </div>
                            <div>
                              <span className="text-[#333333]/60">Modifiche significative: </span>
                              <span className="font-medium text-orange-600">{approval.changes_summary.major_changes}</span>
                            </div>
                            <div>
                              <span className="text-[#333333]/60">Clienti coinvolti: </span>
                              <span className="font-medium">{approval.changes_summary.affected_clients.length}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-[#333333]/60 text-sm">Clienti: </span>
                            <span className="text-sm">{approval.changes_summary.affected_clients.join(', ')}</span>
                          </div>
                        </div>

                        {/* Review Notes */}
                        {approval.notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="text-sm font-medium text-blue-800 mb-1">Note di Revisione</div>
                            <div className="text-sm text-blue-700">{approval.notes}</div>
                            {approval.reviewed_at && (
                              <div className="text-xs text-blue-600 mt-2">
                                Revisionato il {new Date(approval.reviewed_at).toLocaleDateString('it-IT')} alle {new Date(approval.reviewed_at).toLocaleTimeString('it-IT')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-6">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApproval(approval)
                            loadDiffData(approval.id)
                            setShowDiffModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizza Diff
                        </Button>
                        
                        {approval.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setSelectedApproval(approval)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approva
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setSelectedApproval(approval)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Respingi
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedApproval && !showDiffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#333333] mb-4">
              {selectedApproval.status === 'pending' ? 'Revisiona Approvazione' : 'Dettagli Approvazione'}
            </h2>
            <div className="mb-4">
              <div className="text-sm text-[#333333]/60 mb-2">Scenario</div>
              <div className="font-medium">{selectedApproval.scenario_name}</div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Note di Revisione
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Aggiungi note per la revisione..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setSelectedApproval(null)
                  setReviewNotes('')
                }}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
              {selectedApproval.status === 'pending' && (
                <>
                  <Button 
                    onClick={() => handleReject(selectedApproval.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Respingi
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedApproval.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approva
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiffModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#333333]">
                Differenze - {selectedApproval.scenario_name}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDiffModal(false)
                  setSelectedApproval(null)
                }}
              >
                Chiudi
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Cliente</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Mese</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Valore Precedente</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Nuovo Valore</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Variazione</th>
                  </tr>
                </thead>
                <tbody>
                  {diffData.map((diff, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">{diff.client}</td>
                      <td className="border border-gray-200 px-4 py-2">{diff.month}</td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatNumber(diff.old_value)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatNumber(diff.new_value)}
                      </td>
                      <td className={`border border-gray-200 px-4 py-2 text-right font-medium ${
                        diff.change_percentage > 0 ? 'text-green-600' : 
                        diff.change_percentage < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {diff.change_percentage > 0 ? '+' : ''}{diff.change_percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}