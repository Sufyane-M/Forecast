import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Calendar, 
  FileText, 
  CheckCircle, 
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Upload
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Button } from './ui/Button'

interface NavigationItem {
  path: string
  label: string
  icon: React.ComponentType<any>
  roles?: string[]
}

const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: Home
  },
  {
    path: '/forecast-hub',
    label: 'Forecast Hub',
    icon: Calendar,
    roles: ['editor', 'approver', 'admin']
  },
  {
    path: '/import',
    label: 'Import Wizard',
    icon: Upload,
    roles: ['editor', 'admin']
  },
  {
    path: '/approvals',
    label: 'Approvazioni',
    icon: CheckCircle,
    roles: ['approver', 'admin']
  },
  {
    path: '/reports',
    label: 'Report Center',
    icon: BarChart3
  },
  {
    path: '/admin',
    label: 'Admin Panel',
    icon: Settings,
    roles: ['admin']
  }
]

export const Navigation: React.FC = () => {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Errore nel logout:', error)
    }
  }

  const filteredItems = navigationItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(profile?.role || '')
  })

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#0D3F85] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ESA</span>
            </div>
            <span className="ml-3 text-xl font-bold text-[#333333]">Forecast</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#0D3F85] text-white'
                      : 'text-[#333333]/70 hover:text-[#333333] hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-[#333333]/60'
                  }`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#0D3F85] rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-[#333333]">
                {profile?.full_name || 'Utente'}
              </p>
              <p className="text-xs text-[#333333]/60 capitalize">
                {profile?.role || 'viewer'}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSignOut}
              className="ml-2 text-[#333333]/60 hover:text-[#333333]"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#0D3F85] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ESA</span>
            </div>
            <span className="ml-3 text-xl font-bold text-[#333333]">Forecast</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200">
              {/* Mobile Logo */}
              <div className="flex items-center h-16 px-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#0D3F85] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">ESA</span>
                  </div>
                  <span className="ml-3 text-xl font-bold text-[#333333]">Forecast</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="ml-auto"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Navigation Items */}
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="flex-1 px-3 space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon
                    const isActive = isActivePath(item.path)
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#0D3F85] text-white'
                            : 'text-[#333333]/70 hover:text-[#333333] hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-white' : 'text-[#333333]/60'
                        }`} />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Mobile User Profile */}
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#0D3F85] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-[#333333]">
                      {profile?.full_name || 'Utente'}
                    </p>
                    <p className="text-xs text-[#333333]/60 capitalize">
                      {profile?.role || 'viewer'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSignOut}
                    className="ml-2 text-[#333333]/60 hover:text-[#333333]"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}