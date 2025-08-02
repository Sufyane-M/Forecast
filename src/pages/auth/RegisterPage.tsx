import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card'

// Password policy: minimo 8 caratteri, 1 maiuscola, 1 numero
const passwordSchema = z.string()
  .min(8, 'La password deve contenere almeno 8 caratteri')
  .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
  .regex(/[0-9]/, 'La password deve contenere almeno un numero')

const registerSchema = z.object({
  fullName: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword']
})

type RegisterForm = z.infer<typeof registerSchema>

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'Almeno 8 caratteri', test: (pwd) => pwd.length >= 8 },
  { label: 'Una lettera maiuscola', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Un numero', test: (pwd) => /[0-9]/.test(pwd) }
]

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const watchedPassword = watch('password', '')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await signUp(data.email, data.password, data.fullName)
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Un account con questa email esiste già')
        } else if (error.message.includes('Password should be at least')) {
          setError('La password non rispetta i requisiti di sicurezza')
        } else {
          setError('Errore durante la registrazione. Riprova.')
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
                Registrazione completata!
              </h2>
              <p className="text-[#333333]/60 mb-6">
                Ti abbiamo inviato un'email di conferma. Clicca sul link nell'email per attivare il tuo account.
              </p>
              <Button 
                onClick={() => navigate('/auth/login')}
                fullWidth
              >
                Vai al Login
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
            Crea il tuo account
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader 
            title="Registrazione"
            subtitle="Compila i campi per creare il tuo account"
          />
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[#C42024]/10 border border-[#C42024]/20">
                  <p className="text-sm text-[#C42024]">{error}</p>
                </div>
              )}
              
              <Input
                {...register('fullName')}
                type="text"
                label="Nome completo"
                placeholder="Mario Rossi"
                icon={User}
                error={errors.fullName?.message}
                fullWidth
                autoComplete="name"
              />
              
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
              
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Crea una password sicura"
                    icon={Lock}
                    error={errors.password?.message}
                    fullWidth
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-[#333333]/60 hover:text-[#333333]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password requirements */}
                {watchedPassword && (
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => {
                      const isValid = req.test(watchedPassword)
                      return (
                        <div key={index} className="flex items-center gap-2">
                          {isValid ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-[#C42024]" />
                          )}
                          <span className={`text-xs ${
                            isValid ? 'text-green-600' : 'text-[#333333]/60'
                          }`}>
                            {req.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Conferma password"
                  placeholder="Ripeti la password"
                  icon={Lock}
                  error={errors.confirmPassword?.message}
                  fullWidth
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-[#333333]/60 hover:text-[#333333]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
              >
                Crea Account
              </Button>
            </form>
          </CardContent>
          
          <CardFooter>
            <div className="text-center w-full">
              <span className="text-sm text-[#333333]/60">Hai già un account? </span>
              <Link 
                to="/auth/login" 
                className="text-sm text-[#0D3F85] hover:underline font-medium"
              >
                Accedi
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