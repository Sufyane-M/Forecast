import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card'
import { MFAVerification } from '../../components/auth/MFAVerification'

const loginSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(1, 'La password è obbligatoria')
})

type LoginForm = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMFA, setShowMFA] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  
  const navigate = useNavigate()
  const { signIn, mfaRequired, resendEmailVerification } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)
    setEmailNotVerified(null)
    
    try {
      const { error, mfaRequired: needsMFA } = await signIn(data.email, data.password)
      
      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o password non corretti')
        } else if (error.message.includes('Email not confirmed')) {
          setEmailNotVerified(data.email)
          setError('⚠️ Il tuo indirizzo email non è ancora stato verificato. Controlla la tua casella di posta per completare la verifica.')
        } else if (error.message.includes('Profilo utente non trovato')) {
          setError('Profilo utente non trovato. Contatta l\'amministratore.')
        } else if (error.message.includes('Account temporaneamente bloccato')) {
          setError('Account temporaneamente bloccato per troppi tentativi falliti. Riprova più tardi.')
        } else {
          setError(`Errore durante l'accesso: ${error.message}`)
        }
      } else if (needsMFA) {
        setShowMFA(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Errore di connessione. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!emailNotVerified) return
    
    setIsResendingEmail(true)
    try {
      const { error } = await resendEmailVerification(emailNotVerified)
      if (error) {
        setError('Errore durante l\'invio dell\'email. Riprova.')
      } else {
        setError('✅ Email di verifica inviata! Controlla la tua casella di posta.')
      }
    } catch (err) {
      setError('Errore di connessione. Riprova.')
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleMFASuccess = () => {
    navigate('/dashboard')
  }

  const handleMFABack = () => {
    setShowMFA(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D3F85]/5 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0D3F85] mb-2">
            ESA Forecast
          </h1>
          <p className="text-[#333333]/60">
            Piattaforma di gestione forecast aziendale
          </p>
        </div>

        {showMFA ? (
          <MFAVerification 
            onSuccess={handleMFASuccess}
            onBack={handleMFABack}
          />
        ) : (
          <Card variant="elevated">
          <CardHeader 
            title="Accedi al tuo account"
            subtitle="Inserisci le tue credenziali per continuare"
          />
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className={`p-3 rounded-md border ${
                  error.includes('✅') 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-[#C42024]/10 border-[#C42024]/20'
                }`}>
                  <p className={`text-sm ${
                    error.includes('✅') 
                      ? 'text-green-700' 
                      : 'text-[#C42024]'
                  }`}>{error}</p>
                  {emailNotVerified && !error.includes('✅') && (
                    <div className="mt-3">
                      <Button
                        onClick={handleResendEmail}
                        loading={isResendingEmail}
                        variant="outline"
                        size="sm"
                        fullWidth
                      >
                        Reinvia Email di Verifica
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <Input
                {...register('email')}
                type="email"
                label="Email"
                placeholder="nome@azienda.com"
                icon={Mail}
                error={errors.email?.message}
                fullWidth
                autoComplete="email"
              />
              
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Inserisci la tua password"
                  icon={Lock}
                  error={errors.password?.message}
                  fullWidth
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-[#333333]/60 hover:text-[#333333]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
              >
                Accedi
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex-col space-y-4">
            <div className="text-center space-y-2">
              <Link 
                to="/auth/forgot-password" 
                className="text-sm text-[#0D3F85] hover:underline"
              >
                Hai dimenticato la password?
              </Link>
            </div>
            
            <div className="w-full h-px bg-[#333333]/10" />
            
            <div className="text-center">
              <span className="text-sm text-[#333333]/60">Non hai un account? </span>
              <Link 
                to="/auth/register" 
                className="text-sm text-[#0D3F85] hover:underline font-medium"
              >
                Registrati
              </Link>
            </div>
          </CardFooter>
        </Card>
        )}
        
        <div className="text-center mt-8">
          <p className="text-xs text-[#333333]/40">
            © 2024 ESA - Ecologia Soluzione Ambiente
          </p>
        </div>
      </div>
    </div>
  )
}