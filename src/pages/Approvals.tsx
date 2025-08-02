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
  Search,
  Plus,
  GitCompare,
  Bell
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ApprovalRequestCard } from '../components/ApprovalRequestCard'
import { ForecastDiffViewer } from '../components/ForecastDiffViewer'
import { CreateApprovalRequest } from '../components/CreateApprovalRequest'
import { supabase } from '../lib/supabase'

interface ApprovalRequest {
  id: string
  forecast_scenario_id: string
  title: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  request_type: string
  sla_deadline: string
  created_at: string
  requester: {
    full_name: string
    email: string
  }
  approver?: {
    full_name: string
    email: string
  }
  approval_notes?: string
  rejection_reason?: string
  scenario: {
    name: string
  }
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
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
  },
  expired: {
    label: 'Scaduto',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle
  }
}

export const Approvals: React.FC = () => {
  const { user, profile } = useAuthStore()
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [selectedScenarioName, setSelectedScenarioName] = useState<string>('')
  const [showDiffViewer, setShowDiffViewer] = useState(false)
  const [diffScenarioId, setDiffScenarioId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      await Promise.all([
        loadApprovals(),
        loadNotifications(),
        loadScenarios()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          id,
          forecast_scenario_id,
          title,
          description,
          status,
          priority,
          request_type,
          sla_deadline,
          created_at,
          approval_notes,
          rejection_reason,
          requester:profiles!requester_id(full_name, email),
          approver:profiles!approver_id(full_name, email),
          scenario:forecast_scenarios!forecast_scenario_id(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApprovals(data || [])
    } catch (error) {
      console.error('Error loading approvals:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('forecast_scenarios')
        .select('id, name, status')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      if (error) throw error
      setScenarios(data || [])
    } catch (error) {
      console.error('Error loading scenarios:', error)
    }
  }

  const handleCreateRequest = (scenarioId: string, scenarioName: string) => {
    setSelectedScenarioId(scenarioId)
    setSelectedScenarioName(scenarioName)
    setShowCreateRequest(true)
  }

  const handleRequestCreated = () => {
    setShowCreateRequest(false)
    setSelectedScenarioId(null)
    setSelectedScenarioName('')
    loadApprovals() // Ricarica le richieste
  }

  const handleShowDiff = (scenarioId: string) => {
    setDiffScenarioId(scenarioId)
    setShowDiffViewer(true)
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error marking notification as read:', error)
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
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.requester.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (approval.description && approval.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || approval.status === filterStatus
    const matchesType = filterType === 'all' || approval.request_type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const canApprove = () => {
    return profile?.role === 'approver' || profile?.role === 'admin'
  }

  const canCreateRequest = () => {
    return profile?.role === 'editor' || profile?.role === 'approver' || profile?.role === 'admin'
  }

  const getUnreadNotificationsCount = () => {
    return notifications.length
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-center text-[#333333]/60">Caricamento approvazioni...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Workflow Approvazioni</h1>
          <p className="text-[#333333]/60 mt-1">
            Gestisci le richieste di approvazione per i forecast
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getUnreadNotificationsCount() > 0 && (
            <div className="relative">
              <Bell className="h-5 w-5 text-[#0D3F85]" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {getUnreadNotificationsCount()}
              </span>
            </div>
          )}
          {canCreateRequest() && (
            <Button
              onClick={() => setShowCreateRequest(true)}
              className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifiche ({notifications.length})
            </h3>
            <div className="space-y-2">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <p className="font-medium text-sm text-[#333333]">{notification.title}</p>
                    <p className="text-xs text-[#333333]/60">{notification.message}</p>
                  </div>
                  <Button
                    onClick={() => markNotificationAsRead(notification.id)}
                    size="sm"
                    variant="outline"
                  >
                    Segna come letta
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]/40" />
                <Input
                  placeholder="Cerca per titolo, richiedente o descrizione..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
              >
                <option value="all">Tutti gli stati</option>
                <option value="pending">In attesa</option>
                <option value="approved">Approvati</option>
                <option value="rejected">Respinti</option>
                <option value="expired">Scaduti</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
              >
                <option value="all">Tutti i tipi</option>
                <option value="forecast_approval">Approvazione Forecast</option>
                <option value="budget_change">Modifica Budget</option>
                <option value="scenario_publish">Pubblicazione Scenario</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-[#333333]/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333333] mb-2">
                Nessuna richiesta trovata
              </h3>
              <p className="text-[#333333]/60">
                Non ci sono richieste di approvazione che corrispondono ai filtri selezionati.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApprovals.map((approval) => (
            <div key={approval.id} className="relative">
              <ApprovalRequestCard
                request={approval}
                onUpdate={loadApprovals}
                canApprove={canApprove()}
              />
              <div className="absolute top-4 right-4">
                <Button
                  onClick={() => handleShowDiff(approval.forecast_scenario_id)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  Diff
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-4">
              <h3 className="font-medium text-[#333333] mb-4">Seleziona Scenario per Richiesta</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => handleCreateRequest(scenario.id, scenario.name)}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <p className="font-medium text-[#333333]">{scenario.name}</p>
                    <p className="text-sm text-[#333333]/60">Status: {scenario.status}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setShowCreateRequest(false)}
                  variant="outline"
                >
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Approval Request Modal */}
      {selectedScenarioId && (
        <CreateApprovalRequest
          scenarioId={selectedScenarioId}
          scenarioName={selectedScenarioName}
          onSuccess={handleRequestCreated}
          onCancel={() => {
            setSelectedScenarioId(null)
            setSelectedScenarioName('')
          }}
        />
      )}

      {/* Diff Viewer Modal */}
      {showDiffViewer && diffScenarioId && (
        <ForecastDiffViewer
          scenarioId={diffScenarioId}
          onClose={() => {
            setShowDiffViewer(false)
            setDiffScenarioId(null)
          }}
        />
      )}
    </div>
  )
}