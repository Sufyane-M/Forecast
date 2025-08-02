import React, { useState } from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardContent } from '../ui/Card'

interface MFAVerificationProps {
  onSuccess: () => void
  onBack: () => void
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({ onSuccess, onBack }) => {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { verifyMFA, profile } = useAuthStore()

  const handleVerify = async () => {
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
        setToken('')
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && token.length === 6) {
      handleVerify()
    }
  }

  return (
    <Card variant="elevated">
      <CardHeader 
        title="Verifica Autenticazione"
        subtitle={`Inserisci il codice dall'app di autenticazione per ${profile?.email}`}
      />
      
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">
              Sicurezza Avanzata Attiva
            </p>
            <p className="text-sm text-blue-700">
              Il tuo ruolo richiede l'autenticazione a due fattori
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Input
            label="Codice di Verifica"
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={handleKeyPress}
            maxLength={6}
            className="text-center text-lg tracking-widest"
            error={error}
            autoFocus
          />
          
          <p className="text-xs text-[#333333]/60 text-center">
            Apri la tua app di autenticazione e inserisci il codice a 6 cifre
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleVerify}
            loading={loading}
            disabled={token.length !== 6}
            className="flex-1"
          >
            Verifica
          </Button>
          
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            icon={ArrowLeft}
          >
            Indietro
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-[#333333]/60">
            Non riesci ad accedere? Contatta l'amministratore di sistema
          </p>
        </div>
      </CardContent>
    </Card>
  )
}