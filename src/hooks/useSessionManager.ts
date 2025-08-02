import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

interface UseSessionManagerOptions {
  checkInterval?: number // in milliseconds
  warningThreshold?: number // minutes before expiry to show warning
}

export const useSessionManager = (options: UseSessionManagerOptions = {}) => {
  const {
    checkInterval = 60000, // 1 minute
    warningThreshold = 15 // 15 minutes
  } = options

  const { 
    checkSessionValidity, 
    sessionExpiry, 
    user,
    signOut 
  } = useAuthStore()

  const getTimeUntilExpiry = useCallback(() => {
    if (!sessionExpiry) return null
    
    const now = new Date()
    const expiry = new Date(sessionExpiry)
    const diffMs = expiry.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    return diffMinutes
  }, [sessionExpiry])

  const isSessionExpiringSoon = useCallback(() => {
    const minutesLeft = getTimeUntilExpiry()
    return minutesLeft !== null && minutesLeft <= warningThreshold && minutesLeft > 0
  }, [getTimeUntilExpiry, warningThreshold])

  const extendSession = useCallback(async () => {
    try {
      // Forza il refresh del token Supabase
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        throw error
      }
      
      if (data.session) {
        // La sessionExpiry verrà aggiornata automaticamente dall'evento TOKEN_REFRESHED
        console.log('Session refreshed successfully')
        return true
      }
      
      throw new Error('No session returned from refresh')
    } catch (error) {
      console.error('Failed to extend session:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      const isValid = await checkSessionValidity()
      
      if (!isValid) {
        console.log('Session invalid, signing out')
        await signOut()
      }
    }, checkInterval)

    return () => clearInterval(interval)
  }, [user, checkSessionValidity, signOut, checkInterval])

  // Show warning when session is about to expire
  useEffect(() => {
    if (!user || !sessionExpiry) return

    const warningInterval = setInterval(() => {
      if (isSessionExpiringSoon()) {
        // You can dispatch a custom event or use a toast notification here
        const event = new CustomEvent('sessionExpiring', {
          detail: { minutesLeft: getTimeUntilExpiry() }
        })
        window.dispatchEvent(event)
      }
    }, 30000) // Check every 30 seconds for warnings

    return () => clearInterval(warningInterval)
  }, [user, sessionExpiry, isSessionExpiringSoon, getTimeUntilExpiry])

  return {
    sessionExpiry,
    timeUntilExpiry: getTimeUntilExpiry(),
    isExpiringSoon: isSessionExpiringSoon(),
    extendSession
  }
}