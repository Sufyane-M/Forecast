import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar,
  Filter,
  Search,
  Eye,
  Share2,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'

interface Report {
  id: string
  name: string
  type: 'pdf' | 'excel' | 'csv' | 'bi_dataset'
  description: string
  scenario_id: string
  scenario_name: string
  business_line?: string
  generated_at: string
  generated_by: string
  file_size: number
  download_count: number
  status: 'generating' | 'ready' | 'error'
  scheduled: boolean
  next_generation?: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'pdf' | 'excel' | 'csv' | 'bi_dataset'
  icon: React.ComponentType<any>
  color: string
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'consolidated-pdf',
    name: 'Report Consolidato PDF',
    description: 'Report mensile completo con KPI, grafici e analisi',
    type: 'pdf',
    icon: FileText,
    color: 'bg-red-100 text-red-700'
  },
  {
    id: 'excel-export',
    name: 'Export Excel Completo',
    description: 'Tutti i dati forecast in formato Excel per analisi',
    type: 'excel',
    icon: BarChart3,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'bi-dataset',
    name: 'Dataset BI',
    description: 'Dati strutturati in formato Parquet per Business Intelligence',
    type: 'bi_dataset',
    icon: PieChart,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'summary-csv',
    name: 'Riepilogo CSV',
    description: 'Dati aggregati per Business Line in formato CSV',
    type: 'csv',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-700'
  }
]

const statusConfig = {
  generating: {
    label: 'Generazione...',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock
  },
  ready: {
    label: 'Pronto',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: FileText
  },
  error: {
    label: 'Errore',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: FileText
  }
}

export const ReportCenter: React.FC = () => {
  const { profile } = useAuthStore()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      // Simulated data - in real app would come from Supabase
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Report Consolidato Gennaio 2024',
          type: 'pdf',
          description: 'Report mensile completo con analisi KPI',
          scenario_id: 'scenario-1',
          scenario_name: 'Gennaio 2024',
          business_line: 'Tutti',
          generated_at: '2024-01-15T14:30:00Z',
          generated_by: 'Sistema Automatico',
          file_size: 2048576, // 2MB
          download_count: 15,
          status: 'ready',
          scheduled: true,
          next_generation: '2024-02-01T09:00:00Z'
        },
        {
          id: '2',
          name: 'Export Excel Consulting Q1',
          type: 'excel',
          description: 'Dati dettagliati Business Line Consulting',
          scenario_id: 'scenario-2',
          scenario_name: 'Q1 2024',
          business_line: 'Consulting',
          generated_at: '2024-01-14T10:15:00Z',
          generated_by: 'Mario Rossi',
          file_size: 1536000, // 1.5MB
          download_count: 8,
          status: 'ready',
          scheduled: false
        },
        {
          id: '3',
          name: 'Dataset BI Dicembre 2023',
          type: 'bi_dataset',
          description: 'Dati strutturati per Power BI',
          scenario_id: 'scenario-3',
          scenario_name: 'Dicembre 2023',
          generated_at: '2024-01-10T16:45:00Z',
          generated_by: 'Laura Bianchi',
          file_size: 512000, // 512KB
          download_count: 3,
          status: 'ready',
          scheduled: false
        },
        {
          id: '4',
          name: 'Report Febbraio 2024',
          type: 'pdf',
          description: 'Generazione in corso...',
          scenario_id: 'scenario-4',
          scenario_name: 'Febbraio 2024',
          generated_at: '2024-01-16T09:00:00Z',
          generated_by: 'Sistema Automatico',
          file_size: 0,
          download_count: 0,
          status: 'generating',
          scheduled: true
        }
      ]
      
      setReports(mockReports)
    } catch (error) {
      console.error('Errore nel caricamento dei report:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (templateId: string, scenarioId?: string) => {
    try {
      setGenerating(true)
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const template = reportTemplates.find(t => t.id === templateId)
      if (!template) return
      
      const newReport: Report = {
        id: Date.now().toString(),
        name: `${template.name} - ${new Date().toLocaleDateString('it-IT')}`,
        type: template.type,
        description: template.description,
        scenario_id: scenarioId || 'current',
        scenario_name: 'Scenario Corrente',
        generated_at: new Date().toISOString(),
        generated_by: profile?.full_name || 'Utente',
        file_size: Math.floor(Math.random() * 3000000) + 500000, // Random size
        download_count: 0,
        status: 'ready',
        scheduled: false
      }
      
      setReports(prev => [newReport, ...prev])
      setShowGenerateModal(false)
      setSelectedTemplate(null)
      
    } catch (error) {
      console.error('Errore nella generazione del report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = async (reportId: string) => {
    try {
      // Simulate download
      console.log('Download report:', reportId)
      
      // Update download count
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, download_count: report.download_count + 1 }
            : report
        )
      )
      
      // In real app, would trigger actual download
      alert('Download avviato!')
    } catch (error) {
      console.error('Errore nel download:', error)
    }
  }

  const shareReport = async (reportId: string) => {
    try {
      // Simulate sharing
      const shareUrl = `${window.location.origin}/reports/share/${reportId}`
      await navigator.clipboard.writeText(shareUrl)
      alert('Link di condivisione copiato negli appunti!')
    } catch (error) {
      console.error('Errore nella condivisione:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.scenario_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333333]/60">Caricamento report...</p>
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
              <h1 className="text-2xl font-bold text-[#333333]">Report Center</h1>
              <p className="text-[#333333]/60 mt-1">Genera e gestisci i report forecast</p>
            </div>
            <Button 
              onClick={() => setShowGenerateModal(true)}
              className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Genera Report
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reportTemplates.map((template) => {
            const Icon = template.icon
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowGenerateModal(true)
                    }}>
                <CardContent className="p-4">
                  <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-[#333333] mb-1">{template.name}</h3>
                  <p className="text-sm text-[#333333]/60">{template.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cerca report..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
            >
              <option value="all">Tutti i tipi</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="bi_dataset">Dataset BI</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333333] mb-2">
                {searchTerm || typeFilter !== 'all' ? 'Nessun report trovato' : 'Nessun report generato'}
              </h3>
              <p className="text-[#333333]/60 mb-6">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia generando il tuo primo report'
                }
              </p>
              {!searchTerm && typeFilter === 'all' && (
                <Button 
                  onClick={() => setShowGenerateModal(true)}
                  className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Genera Primo Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const StatusIcon = statusConfig[report.status].icon
              const template = reportTemplates.find(t => t.type === report.type)
              const TemplateIcon = template?.icon || FileText
              
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${template?.color || 'bg-gray-100 text-gray-600'} flex items-center justify-center flex-shrink-0`}>
                          <TemplateIcon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#333333]">{report.name}</h3>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[report.status].color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[report.status].label}
                            </div>
                            {report.scheduled && (
                              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Programmato
                              </div>
                            )}
                          </div>
                          
                          <p className="text-[#333333]/60 mb-3">{report.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-[#333333]/60">Scenario: </span>
                              <span className="font-medium">{report.scenario_name}</span>
                            </div>
                            <div>
                              <span className="text-[#333333]/60">Generato da: </span>
                              <span className="font-medium">{report.generated_by}</span>
                            </div>
                            <div>
                              <span className="text-[#333333]/60">Dimensione: </span>
                              <span className="font-medium">{formatFileSize(report.file_size)}</span>
                            </div>
                            <div>
                              <span className="text-[#333333]/60">Download: </span>
                              <span className="font-medium">{report.download_count}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-[#333333]/60 mt-2">
                            Generato il {new Date(report.generated_at).toLocaleDateString('it-IT')} alle {new Date(report.generated_at).toLocaleTimeString('it-IT')}
                            {report.next_generation && (
                              <span className="ml-4">
                                Prossima generazione: {new Date(report.next_generation).toLocaleDateString('it-IT')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-6">
                        {report.status === 'ready' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                              onClick={() => downloadReport(report.id)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareReport(report.id)}
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Condividi
                            </Button>
                          </>
                        )}
                        
                        {report.status === 'generating' && (
                          <div className="text-sm text-[#333333]/60 text-center py-2">
                            <Clock className="w-4 h-4 mx-auto mb-1 animate-spin" />
                            Generazione...
                          </div>
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

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#333333] mb-4">
              {selectedTemplate ? `Genera ${selectedTemplate.name}` : 'Seleziona Tipo Report'}
            </h2>
            
            {!selectedTemplate ? (
              <div className="space-y-3 mb-6">
                {reportTemplates.map((template) => {
                  const Icon = template.icon
                  return (
                    <div 
                      key={template.id}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-3"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-[#333333]">{template.name}</div>
                        <div className="text-sm text-[#333333]/60">{template.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg ${selectedTemplate.color} flex items-center justify-center`}>
                    <selectedTemplate.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-medium text-[#333333]">{selectedTemplate.name}</div>
                    <div className="text-sm text-[#333333]/60">{selectedTemplate.description}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-2">
                      Scenario
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent">
                      <option value="current">Scenario Corrente</option>
                      <option value="january">Gennaio 2024</option>
                      <option value="february">Febbraio 2024</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#333333] mb-2">
                      Business Line
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent">
                      <option value="all">Tutte</option>
                      <option value="consulting">Consulting</option>
                      <option value="development">Development</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setShowGenerateModal(false)
                  setSelectedTemplate(null)
                }}
                variant="outline"
                className="flex-1"
                disabled={generating}
              >
                Annulla
              </Button>
              {selectedTemplate && (
                <Button 
                  onClick={() => generateReport(selectedTemplate.id)}
                  className="flex-1 bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generazione...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Genera
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}