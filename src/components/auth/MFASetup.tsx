import React, { useState } from 'react'
import { Shield, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardContent } from '../ui/Card'

interface MFASetupProps {
  onComplete?: () => void
  onCancel?: () => void
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  
  const { enableMFA, verifyMFA } = useAuthStore()

  const handleSetupMFA = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { error, secret: mfaSecret } = await enableMFA()
      
      if (error) {
        setError('Errore durante la configurazione MFA')
      } else if (mfaSecret) {
        setSecret(mfaSecret)
        setStep('verify')
      }
    } catch (err) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyMFA = async () => {
    if (!token.trim()) {
      setError('Inserisci il codice di verifica')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await verifyMFA(token)
      
      if (error) {
        setError('Codice non valido. Riprova.')
      } else {
        onComplete?.()
      }
    } catch (err) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy secret:', err)
    }
  }

  if (step === 'setup') {
    return (
      <Card variant="elevated">
        <CardHeader 
          title="Configura Autenticazione a Due Fattori"
          subtitle="Aumenta la sicurezza del tuo account"
        />
        
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Sicurezza Avanzata
              </p>
              <p className="text-sm text-blue-700">
                L'MFA è obbligatorio per ruoli Admin e Approver
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-[#333333]">
              Come funziona:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[#333333]/80">
              <li>Installa un'app di autenticazione (Google Authenticator, Authy)</li>
              <li>Scansiona il QR code o inserisci manualmente il codice segreto</li>
              <li>Inserisci il codice a 6 cifre generato dall'app</li>
              <li>Da ora in poi dovrai inserire il codice ad ogni accesso</li>
            </ol>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-[#C42024]/10 border border-[#C42024]/20">
              <p className="text-sm text-[#C42024]">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={handleSetupMFA}
              loading={loading}
              icon={Shield}
              className="flex-1"
            >
              Configura MFA
            </Button>
            
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Annulla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated">
      <CardHeader 
        title="Verifica Configurazione MFA"
        subtitle="Inserisci il codice dall'app di autenticazione"
      />
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Codice Segreto
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={showSecret ? EyeOff : Eye}
                onClick={() => setShowSecret(!showSecret)}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={copySecret}
                className={copied ? 'text-green-600' : ''}
              />
            </div>
            <p className="text-xs text-[#333333]/60 mt-1">
              Inserisci questo codice nella tua app di autenticazione
            </p>
          </div>
          
          <Input
            label="Codice di Verifica"
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="text-center text-lg tracking-widest"
            error={error}
          />
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleVerifyMFA}
            loading={loading}
            disabled={token.length !== 6}
            className="flex-1"
          >
            Verifica e Attiva
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setStep('setup')}
            disabled={loading}
          >
            Indietro
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}