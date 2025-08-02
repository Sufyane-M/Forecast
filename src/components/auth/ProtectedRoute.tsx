import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useSessionManager } from '../../hooks/useSessionManager'
import { Layout } from '../Layout'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'viewer' | 'editor' | 'approver' | 'admin'
  requiredRoles?: ('viewer' | 'editor' | 'approver' | 'admin')[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredRoles 
}) => {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()
  const { isExpiringSoon, timeUntilExpiry } = useSessionManager()

  // Listen for session expiring events
  useEffect(() => {
    const handleSessionExpiring = (event: CustomEvent) => {
      const minutesLeft = event.detail.minutesLeft
      // You can show a toast notification here
      console.warn(`Session expires in ${minutesLeft} minutes`)
    }

    window.addEventListener('sessionExpiring', handleSessionExpiring as EventListener)
    return () => window.removeEventListener('sessionExpiring', handleSessionExpiring as EventListener)
  }, [])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333333]/60">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Check role permissions
  if (requiredRole && profile.role !== requiredRole) {
    // Check if user has higher permissions
    const roleHierarchy = ['viewer', 'editor', 'approver', 'admin']
    const userRoleIndex = roleHierarchy.indexOf(profile.role)
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)
    
    if (userRoleIndex < requiredRoleIndex) {
      return (
        <Layout>
          <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-[#C42024]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#C42024]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#333333] mb-2">
                Accesso Negato
              </h2>
              <p className="text-[#333333]/60 mb-6">
                Non hai i permessi necessari per accedere a questa pagina.
              </p>
              <button 
                onClick={() => window.history.back()}
                className="text-[#0D3F85] hover:underline"
              >
                Torna Indietro
              </button>
            </div>
          </div>
        </Layout>
      )
    }
  }

  // Check multiple roles
  if (requiredRoles && !requiredRoles.includes(profile.role)) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-[#C42024]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C42024]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#333333] mb-2">
              Accesso Negato
            </h2>
            <p className="text-[#333333]/60 mb-6">
              Non hai i permessi necessari per accedere a questa pagina.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="text-[#0D3F85] hover:underline"
            >
              Torna Indietro
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {children}
    </Layout>
  )
}