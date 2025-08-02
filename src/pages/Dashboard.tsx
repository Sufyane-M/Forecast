import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  FileText, 
  Calendar,
  Search,
  Bell,
  Plus,
  CheckCircle,
  BarChart3,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDashboardData } from '../hooks/useDashboardData'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingState, ErrorState, LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SimpleBarChart, TrendIndicator, DonutChart } from '../components/ui/Chart'
import { StatusIndicator } from '../components/ui/MetricsCard'

export const Dashboard: React.FC = () => {
  const { profile } = useAuthStore()
  const { kpiData, businessLineData, alerts, pendingActions, isLoading, error } = useDashboardData()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600'
    if (variance < 0) return 'text-[#C42024]'
    return 'text-[#333333]'
  }

  const getVarianceIcon = (variance: number) => {
    return variance > 0 ? TrendingUp : TrendingDown
  }

  // Handle loading and error states
  if (isLoading) {
    return (
      <div>
        {/* Header */}
        <header className="bg-white border-b border-[#333333]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-[#0D3F85]">
                  ESA Forecast
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <LoadingSpinner size="sm" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#0D3F85] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState message="Caricamento dati dashboard..." />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {/* Header */}
        <header className="bg-white border-b border-[#333333]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-[#0D3F85]">
                  ESA Forecast
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#0D3F85] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState 
            message={error} 
            onRetry={() => window.location.reload()} 
          />
        </main>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-[#333333]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-[#0D3F85]">
                ESA Forecast
              </h1>
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333333]/60" />
                  <input
                    type="text"
                    placeholder="Cerca clienti, commenti, report... (⌘K)"
                    className="pl-10 pr-4 py-2 w-80 border border-[#333333]/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <StatusIndicator 
                status="online" 
                label="Dati in tempo reale" 
              />
              <Button variant="ghost" size="sm" icon={Bell}>
                <span className="sr-only">Notifiche</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#0D3F85] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-[#333333]">
                    {profile?.full_name || 'Utente'}
                  </p>
                  <p className="text-xs text-[#333333]/60 capitalize">
                    {profile?.role || 'viewer'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#333333] mb-2">
            Benvenuto, {profile?.full_name?.split(' ')[0] || 'Utente'}
          </h2>
          <p className="text-[#333333]/60">
            Panoramica del forecast aziendale - {new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333333]/60 mb-1">
                    Budget Dichiarato
                  </p>
                  <p className="text-2xl font-bold text-[#333333]">
                    {formatCurrency(kpiData.budgetDichiarato)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${getVarianceColor(kpiData.variance.dichiarato)}`}>
                    {React.createElement(getVarianceIcon(kpiData.variance.dichiarato), { className: 'h-4 w-4' })}
                    <span className="text-sm font-medium">
                      {formatPercentage(kpiData.variance.dichiarato)}
                    </span>
                  </div>
                  <p className="text-xs text-[#333333]/60 mt-1">
                    vs mese precedente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333333]/60 mb-1">
                    Budget Attivo
                  </p>
                  <p className="text-2xl font-bold text-[#333333]">
                    {formatCurrency(kpiData.budgetAttivo)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${getVarianceColor(kpiData.variance.attivo)}`}>
                    {React.createElement(getVarianceIcon(kpiData.variance.attivo), { className: 'h-4 w-4' })}
                    <span className="text-sm font-medium">
                      {formatPercentage(kpiData.variance.attivo)}
                    </span>
                  </div>
                  <p className="text-xs text-[#333333]/60 mt-1">
                    vs mese precedente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#333333]/60 mb-1">
                    Fast Rolling
                  </p>
                  <p className="text-2xl font-bold text-[#333333]">
                    {formatCurrency(kpiData.fastRolling)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${getVarianceColor(kpiData.variance.fastRolling)}`}>
                    {React.createElement(getVarianceIcon(kpiData.variance.fastRolling), { className: 'h-4 w-4' })}
                    <span className="text-sm font-medium">
                      {formatPercentage(kpiData.variance.fastRolling)}
                    </span>
                  </div>
                  <p className="text-xs text-[#333333]/60 mt-1">
                    vs mese precedente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card variant="elevated">
            <CardHeader title="Distribuzione per Business Line" subtitle="Breakdown del Budget Dichiarato" />
            <CardContent>
              <DonutChart
                data={businessLineData.map((bl, index) => ({
                  label: bl.name.replace('Totale - ', ''),
                  value: bl.budgetDichiarato,
                  color: ['#0D3F85', '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B'][index % 6]
                }))}
                title=""
                centerValue={`€${(kpiData.budgetDichiarato / 1000000).toFixed(1)}M`}
                centerLabel="Totale"
              />
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader title="Confronto Budget" subtitle="Budget Dichiarato vs Attivo vs Fast Rolling" />
            <CardContent>
              <SimpleBarChart
                data={[
                  { label: 'Dichiarato', value: kpiData.budgetDichiarato, color: 'bg-[#0D3F85]' },
                  { label: 'Attivo', value: kpiData.budgetAttivo, color: 'bg-[#4F46E5]' },
                  { label: 'Fast Rolling', value: kpiData.fastRolling, color: 'bg-[#7C3AED]' }
                ]}
                title=""
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Azioni Pendenti */}
          <Card variant="elevated">
            <CardHeader title="Azioni Pendenti" subtitle="Task che richiedono la tua attenzione" />
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action) => {
                  const ActionWrapper = action.scenarioId ? Link : 'div'
                  const wrapperProps = action.scenarioId 
                    ? { to: `/forecast-sheet?scenario=${action.scenarioId}` }
                    : {}
                  
                  return (
                    <ActionWrapper 
                      key={action.id} 
                      {...wrapperProps}
                      className={`flex items-start gap-3 p-3 rounded-lg bg-gray-50 ${
                        action.scenarioId ? 'hover:bg-gray-100 cursor-pointer transition-colors' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {action.type === 'draft' && <FileText className="h-4 w-4 text-[#0D3F85]" />}
                        {action.type === 'approval' && <Users className="h-4 w-4 text-orange-500" />}
                        {action.type === 'comment' && <Bell className="h-4 w-4 text-[#C42024]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#333333]">
                          {action.title}
                        </p>
                        <p className="text-xs text-[#333333]/60">
                          {action.description}
                        </p>
                        {action.dueDate && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-[#333333]/60" />
                            <span className="text-xs text-[#333333]/60">
                              Scadenza: {new Date(action.dueDate).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        )}
                      </div>
                      {action.scenarioId && (
                        <div className="flex-shrink-0 mt-1">
                          <ArrowRight className="h-4 w-4 text-[#333333]/40" />
                        </div>
                      )}
                    </ActionWrapper>
                  )
                })}
                
                {pendingActions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[#333333]/60">Nessuna azione pendente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alert Center */}
          <Card variant="elevated">
            <CardHeader title="Alert Center" subtitle="Valori fuori tolleranza" />
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.type === 'error' ? 'bg-[#C42024]/5 border border-[#C42024]/20' : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="flex-shrink-0 mt-1">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.type === 'error' ? 'text-[#C42024]' : 'text-orange-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#333333]">
                        {alert.client}
                      </p>
                      <p className="text-xs text-[#333333]/60 mb-1">
                        {alert.businessLine}
                      </p>
                      <p className="text-xs text-[#333333]/80">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[#333333]/60">Nessun alert attivo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card variant="elevated">
            <CardHeader title="Azioni Rapide" subtitle="Accesso veloce alle funzioni principali" />
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/forecast-hub">
                  <Button variant="secondary" fullWidth className="h-20 flex-col gap-2">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Forecast Hub</span>
                  </Button>
                </Link>
                
                <Link to="/reports">
                  <Button variant="secondary" fullWidth className="h-20 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Report Center</span>
                  </Button>
                </Link>
                
                <Link to="/approvals">
                  <Button variant="secondary" fullWidth className="h-20 flex-col gap-2">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-sm">Approvazioni</span>
                  </Button>
                </Link>
                
                {profile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="secondary" fullWidth className="h-20 flex-col gap-2">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Admin Panel</span>
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}