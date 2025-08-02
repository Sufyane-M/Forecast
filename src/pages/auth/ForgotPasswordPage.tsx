import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card'

const forgotPasswordSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido')
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { resetPassword } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await resetPassword(data.email)
      
      if (error) {
        if (error.message.includes('User not found')) {
          setError('Nessun account trovato con questa email')
        } else {
          setError('Errore durante l\'invio dell\'email. Riprova.')
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Errore di connessione. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D3F85]/5 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="elevated">
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#333333] mb-2">
                Email inviata!
              </h2>
              <p className="text-[#333333]/60 mb-2">
                Ti abbiamo inviato un'email con le istruzioni per reimpostare la password a:
              </p>
              <p className="font-medium text-[#0D3F85] mb-6">
                {getValues('email')}
              </p>
              <p className="text-sm text-[#333333]/60 mb-6">
                Controlla la tua casella di posta e segui le istruzioni nell'email.
              </p>
              <Button 
                as={Link}
                to="/auth/login"
                variant="ghost"
                icon={ArrowLeft}
                fullWidth
              >
                Torna al Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            Recupera la tua password
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader 
            title="Password dimenticata?"
            subtitle="Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password"
          />
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[#C42024]/10 border border-[#C42024]/20">
                  <p className="text-sm text-[#C42024]">{error}</p>
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
                autoFocus
              />
              
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
              >
                Invia Email di Reset
              </Button>
            </form>
          </CardContent>
          
          <CardFooter>
            <div className="text-center w-full">
              <Link 
                to="/auth/login" 
                className="inline-flex items-center gap-2 text-sm text-[#0D3F85] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna al Login
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-xs text-[#333333]/40">
            © 2024 ESA - Ecologia Soluzione Ambiente
          </p>
        </div>
      </div>
    </div>
  )
}