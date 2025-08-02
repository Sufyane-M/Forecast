import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

interface EmailVerificationRequiredProps {
  email?: string
}

const EmailVerificationRequired: React.FC<EmailVerificationRequiredProps> = ({ email: propEmail }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { resendEmailVerification } = useAuthStore()
  
  // Ottieni l'email dai props o dallo stato della navigazione
  const email = propEmail || location.state?.email
  const [isResending, setIsResending] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null)

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email non disponibile')
      return
    }

    // Controllo per evitare spam (max 1 email ogni 60 secondi)
    if (lastSentTime && Date.now() - lastSentTime.getTime() < 60000) {
      const remainingTime = Math.ceil((60000 - (Date.now() - lastSentTime.getTime())) / 1000)
      toast.error(`Attendi ${remainingTime} secondi prima di richiedere un nuovo invio`)
      return
    }

    setIsResending(true)
    
    try {
      const { error } = await resendEmailVerification(email)
      
      if (error) {
        toast.error('Errore durante l\'invio dell\'email di verifica')
      } else {
        toast.success('Email di verifica inviata con successo!')
        setLastSentTime(new Date())
      }
    } catch (error) {
      toast.error('Errore durante l\'invio dell\'email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Verifica la tua email
          </h2>
          
          <div className="space-y-4 text-gray-600">
            <p>
              Ti abbiamo inviato un'email di verifica all'indirizzo:
            </p>
            
            {email && (
              <p className="font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
                {email}
              </p>
            )}
            
            <p>
              Clicca sul link nell'email per verificare il tuo account e completare la registrazione.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Controlla anche la cartella spam se non vedi l'email nella posta in arrivo.
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full flex items-center justify-center space-x-2"
            >
              {isResending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              <span>
                {isResending ? 'Invio in corso...' : 'Invia di nuovo l\'email'}
              </span>
            </Button>
            
            <Button
              onClick={() => navigate('/auth/login')}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Torna al Login</span>
            </Button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Hai già verificato la tua email?{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Accedi qui
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationRequired