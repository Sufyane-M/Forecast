import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Auth error:', error)
        return { error }
      }

      if (data.user) {
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

        set({ 
          user: data.user, 
          session: data.session,
          profile: profile 
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
          }
        }
      })

      if (error) return { error }

      // Create profile if user was created
      if (data.user && !data.user.email_confirmed_at) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            role: 'viewer',
            language: 'it'
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

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
          set({ 
            user: session.user, 
            session,
            profile: profile 
          })
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile, error: profileError } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', session.user.id)
             .maybeSingle()

          if (profileError) {
             console.error('Profile fetch error during auth change:', profileError)
             await supabase.auth.signOut()
             set({ user: null, profile: null, session: null })
           } else if (!profile) {
             console.error('Profile not found during auth change for user:', session.user.id)
             await supabase.auth.signOut()
             set({ user: null, profile: null, session: null })
           } else {
             set({ 
               user: session.user, 
               session,
               profile: profile 
             })
           }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, session: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false })
    }
  },
}))