import React, { useState, useCallback } from 'react'
import { 
  Upload, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  X,
  Download,
  Eye,
  ArrowRight,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'

interface ImportStep {
  id: number
  title: string
  description: string
}

interface FileData {
  name: string
  size: number
  type: string
  data: any[][]
  headers: string[]
}

interface ValidationError {
  row: number
  column: string
  message: string
  value: any
}

interface ColumnMapping {
  sourceColumn: string
  targetField: string
  required: boolean
}

const importSteps: ImportStep[] = [
  {
    id: 1,
    title: 'Upload File',
    description: 'Carica il file Excel o CSV con i dati forecast'
  },
  {
    id: 2,
    title: 'Mappatura Colonne',
    description: 'Mappa le colonne del file ai campi del sistema'
  },
  {
    id: 3,
    title: 'Validazione',
    description: 'Verifica la correttezza dei dati'
  },
  {
    id: 4,
    title: 'Importazione',
    description: 'Completa l\'importazione dei dati'
  }
]

const targetFields = [
  { key: 'business_line', label: 'Business Line', required: true },
  { key: 'client', label: 'Cliente', required: true },
  { key: 'january', label: 'Gennaio', required: false },
  { key: 'february', label: 'Febbraio', required: false },
  { key: 'march', label: 'Marzo', required: false },
  { key: 'april', label: 'Aprile', required: false },
  { key: 'may', label: 'Maggio', required: false },
  { key: 'june', label: 'Giugno', required: false },
  { key: 'july', label: 'Luglio', required: false },
  { key: 'august', label: 'Agosto', required: false },
  { key: 'september', label: 'Settembre', required: false },
  { key: 'october', label: 'Ottobre', required: false },
  { key: 'november', label: 'Novembre', required: false },
  { key: 'december', label: 'Dicembre', required: false }
]

export const ImportWizard: React.FC = () => {
  const { profile } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validRows, setValidRows] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importComplete, setImportComplete] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        let data: any[][]
        let headers: string[]

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = text.split('\n').filter(line => line.trim())
          data = lines.map(line => line.split(',').map(cell => cell.trim()))
          headers = data[0] || []
          data = data.slice(1)
        } else {
          // Simulate Excel parsing (in real app would use a library like xlsx)
          const lines = text.split('\n').filter(line => line.trim())
          data = lines.map(line => line.split('\t').map(cell => cell.trim()))
          headers = data[0] || []
          data = data.slice(1)
        }

        setFileData({
          name: file.name,
          size: file.size,
          type: file.type,
          data,
          headers
        })

        // Auto-map columns based on header names
        const autoMappings = targetFields.map(field => {
          const matchingHeader = headers.find(header => 
            header.toLowerCase().includes(field.label.toLowerCase()) ||
            header.toLowerCase().includes(field.key.toLowerCase())
          )
          return {
            sourceColumn: matchingHeader || '',
            targetField: field.key,
            required: field.required
          }
        })
        setColumnMappings(autoMappings)
        setCurrentStep(2)
      } catch (error) {
        console.error('Errore nel parsing del file:', error)
        alert('Errore nel parsing del file. Verifica il formato.')
      }
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  const validateData = () => {
    if (!fileData) return

    const errors: ValidationError[] = []
    const valid: any[] = []

    fileData.data.forEach((row, rowIndex) => {
      const rowData: any = {}
      let hasErrors = false

      columnMappings.forEach(mapping => {
        if (!mapping.sourceColumn) {
          if (mapping.required) {
            errors.push({
              row: rowIndex + 1,
              column: mapping.targetField,
              message: 'Campo obbligatorio non mappato',
              value: null
            })
            hasErrors = true
          }
          return
        }

        const columnIndex = fileData.headers.indexOf(mapping.sourceColumn)
        const value = row[columnIndex]

        // Validate required fields
        if (mapping.required && (!value || value.trim() === '')) {
          errors.push({
            row: rowIndex + 1,
            column: mapping.targetField,
            message: 'Campo obbligatorio vuoto',
            value
          })
          hasErrors = true
        }

        // Validate numeric fields (months)
        if (mapping.targetField.includes('january') || 
            mapping.targetField.includes('february') ||
            mapping.targetField.includes('march') ||
            mapping.targetField.includes('april') ||
            mapping.targetField.includes('may') ||
            mapping.targetField.includes('june') ||
            mapping.targetField.includes('july') ||
            mapping.targetField.includes('august') ||
            mapping.targetField.includes('september') ||
            mapping.targetField.includes('october') ||
            mapping.targetField.includes('november') ||
            mapping.targetField.includes('december')) {
          if (value && isNaN(parseFloat(value))) {
            errors.push({
              row: rowIndex + 1,
              column: mapping.targetField,
              message: 'Valore numerico non valido',
              value
            })
            hasErrors = true
          }
        }

        rowData[mapping.targetField] = value
      })

      if (!hasErrors) {
        valid.push(rowData)
      }
    })

    setValidationErrors(errors)
    setValidRows(valid)
    setCurrentStep(3)
  }

  const performImport = async () => {
    try {
      setImporting(true)
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real app, would save to Supabase
      console.log('Importing rows:', validRows)
      
      setImportComplete(true)
      setCurrentStep(4)
    } catch (error) {
      console.error('Errore nell\'importazione:', error)
      alert('Errore durante l\'importazione')
    } finally {
      setImporting(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep(1)
    setFileData(null)
    setColumnMappings([])
    setValidationErrors([])
    setValidRows([])
    setImportComplete(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">Import Wizard</h1>
              <p className="text-[#333333]/60 mt-1">Importa dati forecast da file Excel o CSV</p>
            </div>
            <Button 
              onClick={resetWizard}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Ricomincia
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {importSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id ? 'bg-green-500 border-green-500 text-white' :
                  currentStep === step.id ? 'bg-[#0D3F85] border-[#0D3F85] text-white' :
                  'bg-white border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < importSteps.length - 1 && (
                  <div className={`w-24 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {importSteps.map(step => (
              <div key={step.id} className="text-center" style={{ width: '200px' }}>
                <h3 className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-[#333333]' : 'text-[#333333]/60'
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-[#333333]/60 mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {/* Step 1: File Upload */}
            {currentStep === 1 && (
              <div className="text-center">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer ${
                    isDragActive ? 'border-[#0D3F85] bg-[#0D3F85]/5' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#333333] mb-2">
                    {isDragActive ? 'Rilascia il file qui' : 'Trascina il file qui o clicca per selezionare'}
                  </h3>
                  <p className="text-[#333333]/60 mb-4">
                    Supportati: Excel (.xlsx, .xls) e CSV (.csv)
                  </p>
                  <Button className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white">
                    Seleziona File
                  </Button>
                </div>
                
                <div className="mt-8 text-left">
                  <h4 className="font-medium text-[#333333] mb-4">Formato File Richiesto:</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="font-medium text-[#333333]">Business Line</div>
                      <div className="font-medium text-[#333333]">Cliente</div>
                      <div className="font-medium text-[#333333]">Gennaio</div>
                      <div className="font-medium text-[#333333]">...</div>
                      <div className="text-[#333333]/60">Consulting</div>
                      <div className="text-[#333333]/60">Cliente A</div>
                      <div className="text-[#333333]/60">50000</div>
                      <div className="text-[#333333]/60">...</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Column Mapping */}
            {currentStep === 2 && fileData && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">File Caricato</h3>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <FileText className="w-8 h-8 text-[#0D3F85]" />
                    <div>
                      <div className="font-medium text-[#333333]">{fileData.name}</div>
                      <div className="text-sm text-[#333333]/60">
                        {formatFileSize(fileData.size)} • {fileData.data.length} righe
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-[#333333] mb-4">Mappatura Colonne</h3>
                <div className="space-y-4">
                  {targetFields.map(field => {
                    const mapping = columnMappings.find(m => m.targetField === field.key)
                    return (
                      <div key={field.key} className="flex items-center gap-4">
                        <div className="w-48">
                          <label className="block text-sm font-medium text-[#333333]">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <select 
                            value={mapping?.sourceColumn || ''}
                            onChange={(e) => {
                              setColumnMappings(prev => 
                                prev.map(m => 
                                  m.targetField === field.key 
                                    ? { ...m, sourceColumn: e.target.value }
                                    : m
                                )
                              )
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
                          >
                            <option value="">-- Seleziona colonna --</option>
                            {fileData.headers.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between mt-8">
                  <Button 
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                  </Button>
                  <Button 
                    onClick={validateData}
                    className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                  >
                    Valida Dati
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Validation */}
            {currentStep === 3 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#333333] mb-4">Risultati Validazione</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-800">Righe Valide</div>
                          <div className="text-green-600">{validRows.length} righe</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <div>
                          <div className="font-semibold text-red-800">Errori Trovati</div>
                          <div className="text-red-600">{validationErrors.length} errori</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-[#333333] mb-3">Errori di Validazione</h4>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Riga</th>
                              <th className="px-4 py-2 text-left">Campo</th>
                              <th className="px-4 py-2 text-left">Errore</th>
                              <th className="px-4 py-2 text-left">Valore</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationErrors.map((error, index) => (
                              <tr key={index} className="border-t border-gray-200">
                                <td className="px-4 py-2">{error.row}</td>
                                <td className="px-4 py-2">{error.column}</td>
                                <td className="px-4 py-2 text-red-600">{error.message}</td>
                                <td className="px-4 py-2 font-mono text-xs">{error.value || 'vuoto'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Modifica Mappatura
                  </Button>
                  <Button 
                    onClick={performImport}
                    disabled={validRows.length === 0}
                    className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                  >
                    Importa {validRows.length} Righe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Import Complete */}
            {currentStep === 4 && (
              <div className="text-center">
                {importing ? (
                  <div>
                    <div className="w-16 h-16 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">Importazione in corso...</h3>
                    <p className="text-[#333333]/60">Attendere il completamento dell'operazione</p>
                  </div>
                ) : (
                  <div>
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">Importazione Completata!</h3>
                    <p className="text-[#333333]/60 mb-6">
                      {validRows.length} righe importate con successo
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button 
                        onClick={resetWizard}
                        variant="outline"
                      >
                        Nuova Importazione
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/forecast-hub'}
                        className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white"
                      >
                        Vai al Forecast Hub
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}