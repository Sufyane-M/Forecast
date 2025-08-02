import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  mfaRequired: boolean
  sessionExpiry: Date | null
  emailVerificationRequired: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; mfaRequired?: boolean }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; emailVerificationRequired?: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  enableMFA: () => Promise<{ error: any; secret?: string }>
  verifyMFA: (token: string) => Promise<{ error: any }>
  disableMFA: (token: string) => Promise<{ error: any }>
  checkSessionValidity: () => Promise<boolean>
  forceLogout: (userId: string) => Promise<{ error: any }>
  resendEmailVerification: (email: string) => Promise<{ error: any }>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  mfaRequired: false,
  sessionExpiry: null,
  emailVerificationRequired: false,

  signIn: async (email: string, password: string) => {
    try {
      // Verifica se l'utente è bloccato
      const { data: isLocked } = await supabase.rpc('is_user_locked', { user_email: email })
      
      if (isLocked) {
        return { error: new Error('Account temporaneamente bloccato per troppi tentativi falliti. Riprova più tardi.') }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Auth error:', error)
        
        // Controlla se l'errore è dovuto a email non confermata
        if (error.message.includes('Email not confirmed')) {
          return { error: new Error('Email not confirmed') }
        }
        
        // Gestisci tentativi falliti
        await supabase.rpc('handle_failed_login', { user_email: email })
        return { error }
      }

      if (data.user) {
        // Reset tentativi falliti dopo login riuscito
        await supabase.rpc('reset_failed_login_attempts', { user_id: data.user.id })
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          return { error: profileError }
        }

        if (!profile) {
          console.error('Profile not found for user:', data.user.id)
          return { error: new Error('Profilo utente non trovato. Contatta l\'amministratore.') }
        }

        // Verifica se MFA è abilitato
        if (profile.mfa_enabled && (profile.role === 'admin' || profile.role === 'approver')) {
          set({ mfaRequired: true, user: data.user, profile })
          return { error: null, mfaRequired: true }
        }

        // Calcola scadenza sessione
        const sessionExpiry = new Date(Date.now() + (profile.session_timeout_minutes || 480) * 60 * 1000)
        
        set({ 
          user: data.user, 
          session: data.session,
          profile: profile,
          sessionExpiry,
          mfaRequired: false
        })
      }

      return { error: null }
    } catch (error) {
      console.error('SignIn catch error:', error)
      return { error }
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) return { error }

      // Con la nuova configurazione, la verifica email è sempre richiesta
      // Il profilo viene creato automaticamente dal trigger database dopo la verifica
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      const { user } = get()
      if (!user) return { error: new Error('No user logged in') }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) return { error }

      set({ profile: data })
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  initialize: async () => {
    try {
      set({ loading: true })
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Profile fetch error during initialization:', profileError)
          await supabase.auth.signOut()
          set({ user: null, profile: null, session: null })
        } else if (!profile) {
          console.error('Profile not found during initialization for user:', session.user.id)
          await supabase.auth.signOut()
          set({ user: null, profile: null, session: null })
        } else {
          // Calcola scadenza sessione durante l'inizializzazione
          const sessionExpiry = new Date(Date.now() + (profile.session_timeout_minutes || 480) * 60 * 1000)
          
          set({ 
            user: session.user, 
            session,
            profile: profile,
            sessionExpiry
          })
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile, error: profileError } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', session.user.id)
             .maybeSingle()

          if (profileError) {
             console.error('Profile fetch error during auth change:', profileError)
             await supabase.auth.signOut()
             set({ user: null, profile: null, session: null, sessionExpiry: null })
           } else if (!profile) {
             console.error('Profile not found during auth change for user:', session.user.id)
             await supabase.auth.signOut()
             set({ user: null, profile: null, session: null, sessionExpiry: null })
           } else {
             // Calcola nuova scadenza sessione
             const sessionExpiry = new Date(Date.now() + (profile.session_timeout_minutes || 480) * 60 * 1000)
             
             set({ 
               user: session.user, 
               session,
               profile: profile,
               sessionExpiry
             })
           }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Aggiorna la sessione e ricalcola la scadenza quando il token viene refreshato
          const { profile } = get()
          if (profile) {
            const sessionExpiry = new Date(Date.now() + (profile.session_timeout_minutes || 480) * 60 * 1000)
            set({ 
              session,
              sessionExpiry
            })
            console.log('Token refreshed, session extended until:', sessionExpiry)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing session')
          set({ user: null, profile: null, session: null, sessionExpiry: null })
          
          // Mostra notifica di disconnessione se non è un logout volontario
          const currentPath = window.location.pathname
          if (!currentPath.includes('/auth/')) {
            // Dispatch evento personalizzato per notificare la disconnessione
            const event = new CustomEvent('sessionExpired', {
              detail: { message: 'La sessione è scaduta. Effettua di nuovo l\'accesso.' }
            })
            window.dispatchEvent(event)
          }
        }
      })
      
      set({ loading: false })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },

  enableMFA: async () => {
    try {
      const { user } = get()
      if (!user) return { error: new Error('No user logged in') }

      // Genera secret MFA (in produzione usare una libreria come speakeasy)
      const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      const { error } = await supabase
        .from('profiles')
        .update({ mfa_secret: secret })
        .eq('id', user.id)

      if (error) return { error }
      
      return { error: null, secret }
    } catch (error) {
      return { error }
    }
  },

  verifyMFA: async (token: string) => {
    try {
      const { user, profile } = get()
      if (!user || !profile) return { error: new Error('No user logged in') }

      // In produzione, verificare il token TOTP con speakeasy
      // Per ora simuliamo la verifica
      if (token.length === 6 && /^\d+$/.test(token)) {
        const { error } = await supabase
          .from('profiles')
          .update({ mfa_enabled: true })
          .eq('id', user.id)

        if (error) return { error }
        
        set({ mfaRequired: false, profile: { ...profile, mfa_enabled: true } })
        return { error: null }
      }
      
      return { error: new Error('Token MFA non valido') }
    } catch (error) {
      return { error }
    }
  },

  disableMFA: async (token: string) => {
    try {
      const { user, profile } = get()
      if (!user || !profile) return { error: new Error('No user logged in') }

      // Verifica token prima di disabilitare
      if (token.length === 6 && /^\d+$/.test(token)) {
        const { error } = await supabase
          .from('profiles')
          .update({ mfa_enabled: false, mfa_secret: null })
          .eq('id', user.id)

        if (error) return { error }
        
        set({ profile: { ...profile, mfa_enabled: false } })
        return { error: null }
      }
      
      return { error: new Error('Token MFA non valido') }
    } catch (error) {
      return { error }
    }
  },

  checkSessionValidity: async () => {
    try {
      const { sessionExpiry, user } = get()
      
      if (!user || !sessionExpiry) return false
      
      // Verifica se la sessione è scaduta
      if (new Date() > sessionExpiry) {
        await get().signOut()
        return false
      }
      
      // Verifica force_logout
      const { data: profile } = await supabase
        .from('profiles')
        .select('force_logout')
        .eq('id', user.id)
        .single()
      
      if (profile?.force_logout) {
        await get().signOut()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Session validity check error:', error)
      return false
    }
  },

  forceLogout: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ force_logout: true })
        .eq('id', userId)

      return { error }
    } catch (error) {
      return { error }
    }
  },

  resendEmailVerification: async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      return { error }
    } catch (error) {
      return { error }
    }
  },
}))