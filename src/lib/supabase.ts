import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Refresh token 5 minutes before expiry
    refreshTokenMargin: 300,
    // Storage key for session persistence
    storageKey: 'forecast-auth-token',
    // Debug mode for development
    debug: import.meta.env.DEV
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'viewer' | 'editor' | 'approver' | 'admin'
          business_line_id: string | null
          language: 'it' | 'en'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'viewer' | 'editor' | 'approver' | 'admin'
          business_line_id?: string | null
          language?: 'it' | 'en'
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'viewer' | 'editor' | 'approver' | 'admin'
          business_line_id?: string | null
          language?: 'it' | 'en'
        }
      }
      business_lines: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          responsible_user_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      clients: {
        Row: {
          id: string
          code: string
          name: string
          business_line_id: string
          contact_info: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      forecast_scenarios: {
        Row: {
          id: string
          name: string
          month: number
          year: number
          status: 'draft' | 'in_review_1' | 'in_review_2' | 'approved'
          created_by: string
          responsible_bl_user_id: string | null
          cut_off_date: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
      }
      forecast_data: {
        Row: {
          id: string
          scenario_id: string
          business_line_id: string
          client_id: string
          budget_dichiarato: number | null
          budget_attivo: number | null
          fast_rolling: number | null
          cell_status: any
          validation_errors: any
          created_at: string
          updated_at: string
        }
      }
      comments: {
        Row: {
          id: string
          forecast_data_id: string | null
          parent_comment_id: string | null
          author_id: string
          content: string
          mentions: any
          attachments: any
          is_resolved: boolean
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type BusinessLine = Database['public']['Tables']['business_lines']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ForecastScenario = Database['public']['Tables']['forecast_scenarios']['Row']
export type ForecastData = Database['public']['Tables']['forecast_data']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']