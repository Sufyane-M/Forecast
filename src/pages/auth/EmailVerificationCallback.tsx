import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/button'

const EmailVerificationCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          })

          if (error) {
            setStatus('error')
            setMessage('Errore durante la verifica dell\'email. Il link potrebbe essere scaduto.')
          } else {
            setStatus('success')
            setMessage('Email verificata con successo! Ora puoi accedere alla piattaforma.')
            
            // Reindirizza al login dopo 3 secondi
            setTimeout(() => {
              navigate('/auth/login')
            }, 3000)
          }
        } else {
          setStatus('error')
          setMessage('Link di verifica non valido.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Si è verificato un errore durante la verifica.')
      }
    }

    handleEmailVerification()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4">
            {status === 'loading' && (
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            {status === 'loading' && 'Verifica in corso...'}
            {status === 'success' && 'Verifica completata!'}
            {status === 'error' && 'Verifica fallita'}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Verrai reindirizzato automaticamente al login...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/auth/login')}
                className="w-full"
              >
                Torna al Login
              </Button>
              <Button
                onClick={() => navigate('/auth/register')}
                variant="outline"
                className="w-full"
              >
                Registrati di nuovo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationCallback