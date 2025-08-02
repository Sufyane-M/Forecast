import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Settings, 
  Shield, 
  Database,
  Mail,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  Key
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  role: 'viewer' | 'editor' | 'approver' | 'admin'
  business_line?: string
  status: 'active' | 'suspended' | 'pending'
  last_login?: string
  created_at: string
}

interface BusinessLine {
  id: string
  name: string
  code: string
  manager_id?: string
  description?: string
  active: boolean
}

interface SystemConfig {
  id: string
  key: string
  value: string
  description: string
  category: 'validation' | 'alerts' | 'email' | 'general'
}

interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  resource: string
  details: string
  timestamp: string
  ip_address: string
}

const roleConfig = {
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
  editor: { label: 'Editor', color: 'bg-blue-100 text-blue-800' },
  approver: { label: 'Approver', color: 'bg-green-100 text-green-800' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-800' }
}

const statusConfig = {
  active: { label: 'Attivo', color: 'bg-green-100 text-green-800' },
  suspended: { label: 'Sospeso', color: 'bg-red-100 text-red-800' },
  pending: { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800' }
}

export const AdminPanel: React.FC = () => {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'users' | 'business-lines' | 'config' | 'logs'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([])
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'users') {
        await loadUsers()
      } else if (activeTab === 'business-lines') {
        await loadBusinessLines()
      } else if (activeTab === 'config') {
        await loadSystemConfigs()
      } else if (activeTab === 'logs') {
        await loadAuditLogs()
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    // Simulated data - in real app would come from Supabase
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'mario.rossi@esa.it',
        full_name: 'Mario Rossi',
        role: 'editor',
        business_line: 'Consulting',
        status: 'active',
        last_login: '2024-01-16T10:30:00Z',
        created_at: '2024-01-01T09:00:00Z'
      },
      {
        id: '2',
        email: 'laura.bianchi@esa.it',
        full_name: 'Laura Bianchi',
        role: 'approver',
        business_line: 'Development',
        status: 'active',
        last_login: '2024-01-15T14:20:00Z',
        created_at: '2024-01-02T10:00:00Z'
      },
      {
        id: '3',
        email: 'marco.verdi@esa.it',
        full_name: 'Marco Verdi',
        role: 'viewer',
        business_line: 'Support',
        status: 'suspended',
        last_login: '2024-01-10T16:45:00Z',
        created_at: '2024-01-03T11:00:00Z'
      },
      {
        id: '4',
        email: 'anna.neri@esa.it',
        full_name: 'Anna Neri',
        role: 'admin',
        status: 'active',
        last_login: '2024-01-16T09:15:00Z',
        created_at: '2024-01-01T08:00:00Z'
      }
    ]
    setUsers(mockUsers)
  }

  const loadBusinessLines = async () => {
    const mockBusinessLines: BusinessLine[] = [
      {
        id: '1',
        name: 'Consulting',
        code: 'CONS',
        manager_id: '1',
        description: 'Servizi di consulenza aziendale',
        active: true
      },
      {
        id: '2',
        name: 'Development',
        code: 'DEV',
        manager_id: '2',
        description: 'Sviluppo software e applicazioni',
        active: true
      },
      {
        id: '3',
        name: 'Support',
        code: 'SUP',
        description: 'Supporto tecnico e assistenza clienti',
        active: false
      }
    ]
    setBusinessLines(mockBusinessLines)
  }

  const loadSystemConfigs = async () => {
    const mockConfigs: SystemConfig[] = [
      {
        id: '1',
        key: 'fast_rolling_threshold',
        value: '10',
        description: 'Soglia percentuale per alert Fast Rolling vs Attivo',
        category: 'alerts'
      },
      {
        id: '2',
        key: 'active_threshold',
        value: '5',
        description: 'Soglia percentuale per alert Attivo vs Dichiarato',
        category: 'alerts'
      },
      {
        id: '3',
        key: 'approval_sla_days',
        value: '3',
        description: 'Giorni limite per approvazione (SLA)',
        category: 'validation'
      },
      {
        id: '4',
        key: 'smtp_server',
        value: 'smtp.esa.it',
        description: 'Server SMTP per invio email',
        category: 'email'
      },
      {
        id: '5',
        key: 'backup_retention_days',
        value: '35',
        description: 'Giorni di retention per backup automatici',
        category: 'general'
      }
    ]
    setSystemConfigs(mockConfigs)
  }

  const loadAuditLogs = async () => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        user_id: '1',
        user_name: 'Mario Rossi',
        action: 'UPDATE',
        resource: 'forecast_data',
        details: 'Aggiornato valore Cliente A - Gennaio: 50000 → 55000',
        timestamp: '2024-01-16T10:30:00Z',
        ip_address: '192.168.1.100'
      },
      {
        id: '2',
        user_id: '2',
        user_name: 'Laura Bianchi',
        action: 'APPROVE',
        resource: 'forecast_scenario',
        details: 'Approvato scenario Gennaio 2024',
        timestamp: '2024-01-16T09:15:00Z',
        ip_address: '192.168.1.101'
      },
      {
        id: '3',
        user_id: '4',
        user_name: 'Anna Neri',
        action: 'CREATE',
        resource: 'user',
        details: 'Creato nuovo utente: giovanni.blu@esa.it',
        timestamp: '2024-01-15T16:45:00Z',
        ip_address: '192.168.1.102'
      }
    ]
    setAuditLogs(mockLogs)
  }

  const inviteUser = async (email: string, role: string, businessLine?: string) => {
    try {
      // Simulate user invitation
      console.log('Inviting user:', { email, role, businessLine })
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        full_name: email.split('@')[0].replace('.', ' '),
        role: role as any,
        business_line: businessLine,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      setUsers(prev => [newUser, ...prev])
      setShowInviteModal(false)
      
      alert('Invito inviato con successo!')
    } catch (error) {
      console.error('Errore nell\'invio dell\'invito:', error)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      setUsers(prev => 
        prev.map(user => {
          if (user.id === userId) {
            const newStatus = user.status === 'active' ? 'suspended' : 'active'
            return { ...user, status: newStatus }
          }
          return user
        })
      )
    } catch (error) {
      console.error('Errore nel cambio stato utente:', error)
    }
  }

  const resetUserPassword = async (userId: string) => {
    try {
      // Simulate password reset
      console.log('Resetting password for user:', userId)
      alert('Email di reset password inviata!')
    } catch (error) {
      console.error('Errore nel reset password:', error)
    }
  }

  const updateSystemConfig = async (configId: string, newValue: string) => {
    try {
      setSystemConfigs(prev => 
        prev.map(config => 
          config.id === configId ? { ...config, value: newValue } : config
        )
      )
    } catch (error) {
      console.error('Errore nell\'aggiornamento configurazione:', error)
    }
  }

  const exportAuditLogs = async () => {
    try {
      // Simulate export
      console.log('Exporting audit logs...')
      alert('Export avviato!')
    } catch (error) {
      console.error('Errore nell\'export:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.business_line && user.business_line.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredLogs = auditLogs.filter(log => 
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333333]/60">Caricamento pannello admin...</p>
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
              <h1 className="text-2xl font-bold text-[#333333]">Pannello Amministrazione</h1>
              <p className="text-[#333333]/60 mt-1">Gestisci utenti, configurazioni e sicurezza</p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'users' && (
                <Button 
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invita Utente
                </Button>
              )}
              {activeTab === 'logs' && (
                <Button 
                  onClick={exportAuditLogs}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Esporta Log
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'users', label: 'Utenti', icon: Users },
              { id: 'business-lines', label: 'Business Line', icon: Database },
              { id: 'config', label: 'Configurazioni', icon: Settings },
              { id: 'logs', label: 'Log Audit', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-[#0D3F85] text-[#0D3F85]'
                      : 'border-transparent text-[#333333]/60 hover:text-[#333333] hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        {(activeTab === 'users' || activeTab === 'logs') && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={activeTab === 'users' ? 'Cerca utenti...' : 'Cerca nei log...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0D3F85] rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#333333]">{user.full_name}</h3>
                        <p className="text-[#333333]/60">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig[user.role].color}`}>
                            {roleConfig[user.role].label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[user.status].color}`}>
                            {statusConfig[user.status].label}
                          </span>
                          {user.business_line && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {user.business_line}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserPassword(user.id)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id)}
                        className={user.status === 'suspended' ? 'text-green-600' : 'text-red-600'}
                      >
                        {user.status === 'suspended' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {user.last_login && (
                    <div className="mt-3 text-sm text-[#333333]/60">
                      Ultimo accesso: {new Date(user.last_login).toLocaleDateString('it-IT')} alle {new Date(user.last_login).toLocaleTimeString('it-IT')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Business Lines Tab */}
        {activeTab === 'business-lines' && (
          <div className="space-y-4">
            {businessLines.map(bl => (
              <Card key={bl.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#333333]">{bl.name}</h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {bl.code}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bl.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {bl.active ? 'Attiva' : 'Inattiva'}
                        </span>
                      </div>
                      {bl.description && (
                        <p className="text-[#333333]/60 mt-1">{bl.description}</p>
                      )}
                      {bl.manager_id && (
                        <p className="text-sm text-[#333333]/60 mt-2">
                          Manager: {users.find(u => u.id === bl.manager_id)?.full_name || 'Non assegnato'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {['alerts', 'validation', 'email', 'general'].map(category => {
              const categoryConfigs = systemConfigs.filter(c => c.category === category)
              if (categoryConfigs.length === 0) return null
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-[#333333] capitalize">
                      {category === 'alerts' ? 'Avvisi' : 
                       category === 'validation' ? 'Validazione' :
                       category === 'email' ? 'Email' : 'Generale'}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryConfigs.map(config => (
                        <div key={config.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-[#333333]">{config.description}</div>
                            <div className="text-sm text-[#333333]/60 mt-1">Chiave: {config.key}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              value={config.value}
                              onChange={(e) => updateSystemConfig(config.id, e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <Card key={log.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-[#333333]">{log.resource}</span>
                      </div>
                      <p className="text-[#333333] mb-2">{log.details}</p>
                      <div className="flex items-center gap-4 text-sm text-[#333333]/60">
                        <span>Utente: {log.user_name}</span>
                        <span>IP: {log.ip_address}</span>
                        <span>{new Date(log.timestamp).toLocaleDateString('it-IT')} alle {new Date(log.timestamp).toLocaleTimeString('it-IT')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#333333] mb-4">Invita Nuovo Utente</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              inviteUser(
                formData.get('email') as string,
                formData.get('role') as string,
                formData.get('businessLine') as string
              )
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">Email</label>
                  <Input name="email" type="email" required placeholder="utente@esa.it" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">Ruolo</label>
                  <select name="role" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent">
                    <option value="">Seleziona ruolo</option>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="approver">Approver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">Business Line</label>
                  <select name="businessLine" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent">
                    <option value="">Nessuna</option>
                    {businessLines.filter(bl => bl.active).map(bl => (
                      <option key={bl.id} value={bl.name}>{bl.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                >
                  Invia Invito
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}