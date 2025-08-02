import React, { useEffect, useState } from 'react'
import { AlertTriangle, LogOut } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface SessionExpiredModalProps {
  show: boolean
  message: string
  onRedirect: () => void
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  show,
  message,
  onRedirect
}) => {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!show) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [show, onRedirect])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Sessione Scaduta
              </h2>
              <p className="text-sm text-gray-600">
                Reindirizzamento automatico in {countdown}s
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            {message}
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={onRedirect}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Vai al Login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}