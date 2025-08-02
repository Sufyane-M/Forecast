import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Utility functions for testing session management
 * These should only be used in development/testing
 */

export const sessionTestUtils = {
  /**
   * Force session expiry for testing
   */
  forceSessionExpiry: () => {
    const { sessionExpiry } = useAuthStore.getState()
    if (sessionExpiry) {
      // Set session expiry to 1 minute ago
      const expiredTime = new Date(Date.now() - 60000)
      useAuthStore.setState({ sessionExpiry: expiredTime })
      console.log('Session expiry forced to:', expiredTime)
    }
  },

  /**
   * Set session to expire in X minutes for testing
   */
  setSessionExpiryInMinutes: (minutes: number) => {
    const newExpiry = new Date(Date.now() + minutes * 60000)
    useAuthStore.setState({ sessionExpiry: newExpiry })
    console.log(`Session will expire in ${minutes} minutes at:`, newExpiry)
  },

  /**
   * Get current session info
   */
  getSessionInfo: () => {
    const { user, session, sessionExpiry } = useAuthStore.getState()
    return {
      userId: user?.id,
      sessionExpiry,
      timeUntilExpiry: sessionExpiry ? Math.floor((sessionExpiry.getTime() - Date.now()) / 60000) : null,
      isExpired: sessionExpiry ? new Date() > sessionExpiry : false
    }
  },

  /**
   * Test token refresh
   */
  testTokenRefresh: async () => {
    try {
      console.log('Testing token refresh...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Token refresh failed:', error)
        return { success: false, error }
      }
      
      console.log('Token refresh successful:', data.session?.expires_at)
      return { success: true, session: data.session }
    } catch (error) {
      console.error('Token refresh error:', error)
      return { success: false, error }
    }
  },

  /**
   * Simulate session expired event
   */
  simulateSessionExpired: () => {
    const event = new CustomEvent('sessionExpired', {
      detail: { message: 'Test: La sessione è scaduta. Effettua di nuovo l\'accesso.' }
    })
    window.dispatchEvent(event)
  },

  /**
   * Simulate session expiring warning
   */
  simulateSessionExpiring: (minutesLeft: number = 5) => {
    const event = new CustomEvent('sessionExpiring', {
      detail: { minutesLeft }
    })
    window.dispatchEvent(event)
  }
}

// Make available globally in development
if (import.meta.env.DEV) {
  (window as any).sessionTestUtils = sessionTestUtils
  console.log('Session test utilities available at window.sessionTestUtils')
}