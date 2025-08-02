import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { Dashboard } from './pages/Dashboard'
import { ForecastHub } from './pages/ForecastHub'
import { ForecastSheet } from './pages/ForecastSheet'
import { Approvals } from './pages/Approvals'
import { ReportCenter } from './pages/ReportCenter'
import { AdminPanel } from './pages/AdminPanel'
import { ImportWizard } from './pages/ImportWizard'

function App() {
  const { initialize, loading, user, profile } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0D3F85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333333]/60">Caricamento applicazione...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/auth/login" 
          element={user && profile ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/auth/register" 
          element={user && profile ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
        />
        <Route 
          path="/auth/forgot-password" 
          element={user && profile ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/forecast-hub" 
          element={
            <ProtectedRoute>
              <ForecastHub />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/forecast/:scenarioId" 
          element={
            <ProtectedRoute>
              <ForecastSheet />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/approvals" 
          element={
            <ProtectedRoute>
              <Approvals />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <ReportCenter />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/import" 
          element={
            <ProtectedRoute>
              <ImportWizard />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            user && profile ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />
          } 
        />
        
        {/* 404 */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#333333] mb-2">Pagina non trovata</h2>
                <p className="text-[#333333]/60 mb-4">La pagina che stai cercando non esiste.</p>
                <button 
                  onClick={() => window.history.back()}
                  className="text-[#0D3F85] hover:underline"
                >
                  Torna Indietro
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
