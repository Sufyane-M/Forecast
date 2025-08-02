import React, { useEffect, useState } from 'react'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSessionManager } from '../hooks/useSessionManager'
import { SessionExpiredModal } from './SessionExpiredModal'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { toast } from 'sonner'

export const SessionManager: React.FC = () => {
  const { user, signOut } = useAuthStore()
  const { isExpiringSoon, timeUntilExpiry, extendSession } = useSessionManager({
    checkInterval: 60000, // Check every minute
    warningThreshold: 15 // Show warning 15 minutes before expiry
  })
  
  const [showWarning, setShowWarning] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [expiredMessage, setExpiredMessage] = useState('')

  // Listen for session expiring events
  useEffect(() => {
    const handleSessionExpiring = (event: CustomEvent) => {
      const minutesLeft = event.detail.minutesLeft
      if (minutesLeft <= 15 && minutesLeft > 0) {
        setShowWarning(true)
        toast.warning(`La sessione scadrà tra ${minutesLeft} minuti`, {
          duration: 10000,
          action: {
            label: 'Estendi',
            onClick: handleExtendSession
          }
        })
      }
    }

    const handleSessionExpired = (event: CustomEvent) => {
      const message = event.detail.message
      setExpiredMessage(message)
      setShowExpiredModal(true)
      setShowWarning(false)
    }

    window.addEventListener('sessionExpiring', handleSessionExpiring as EventListener)
    window.addEventListener('sessionExpired', handleSessionExpired as EventListener)
    
    return () => {
      window.removeEventListener('sessionExpiring', handleSessionExpiring as EventListener)
      window.removeEventListener('sessionExpired', handleSessionExpired as EventListener)
    }
  }, [])

  // Show warning when session is expiring soon
  useEffect(() => {
    if (isExpiringSoon && timeUntilExpiry && timeUntilExpiry > 0) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [isExpiringSoon, timeUntilExpiry])

  const handleExtendSession = async () => {
    setIsExtending(true)
    try {
      await extendSession()
      setShowWarning(false)
      toast.success('Sessione estesa con successo')
    } catch (error) {
      console.error('Error extending session:', error)
      toast.error('Errore nell\'estensione della sessione')
    } finally {
      setIsExtending(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  const handleRedirectToLogin = () => {
    window.location.href = '/auth/login'
  }

  // Don't render if user is not logged in
  if (!user) return null

  return (
    <>
      {/* Session Expiring Warning */}
      {showWarning && timeUntilExpiry && timeUntilExpiry > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Sessione in scadenza
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    La tua sessione scadrà tra {timeUntilExpiry} minuti.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleExtendSession}
                      disabled={isExtending}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {isExtending ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Estendendo...
                        </>
                      ) : (
                        'Estendi sessione'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSignOut}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      Esci
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowWarning(false)}
                  className="text-yellow-600 hover:bg-yellow-100 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Session Expired Modal */}
      <SessionExpiredModal
        show={showExpiredModal}
        message={expiredMessage}
        onRedirect={handleRedirectToLogin}
      />
    </>
  )
}