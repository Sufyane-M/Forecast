import React, { useEffect, useState } from 'react'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

interface NotificationManagerProps {
  onNotificationCount?: (count: number) => void
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ onNotificationCount }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.id) {
      loadNotifications()
      setupRealtimeSubscription()
    }
  }, [profile?.id])

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length
    onNotificationCount?.(unreadCount)
  }, [notifications, onNotificationCount])

  const loadNotifications = async () => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          
          // Mostra notifica browser se supportata
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id
            })
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!profile?.id) return

    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_request':
        return <Bell className="h-4 w-4 text-blue-500" />
      case 'request_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'request_rejected':
        return <X className="h-4 w-4 text-red-500" />
      case 'sla_reminder':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'request_expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Ora'
    if (diffInMinutes < 60) return `${diffInMinutes}m fa`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h fa`
    return `${Math.floor(diffInMinutes / 1440)}g fa`
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-[#333333] hover:text-[#0D3F85] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#333333]">Notifiche</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Segna tutte come lette
                  </Button>
                )}
                <Button
                  onClick={() => setShowPanel(false)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Permission Request */}
            {'Notification' in window && Notification.permission === 'default' && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800 mb-2">Abilita le notifiche del browser per rimanere aggiornato</p>
                <Button
                  onClick={requestNotificationPermission}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Abilita Notifiche
                </Button>
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[#333333]/60">
                Caricamento notifiche...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-[#333333]/60">
                Nessuna notifica
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium text-[#333333] ${
                            !notification.is_read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-[#333333]/70 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#333333]/50 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              size="sm"
                              variant="outline"
                              className="p-1 h-6 w-6"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            size="sm"
                            variant="outline"
                            className="p-1 h-6 w-6 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Button
                onClick={() => {
                  setShowPanel(false)
                  // Qui si potrebbe navigare a una pagina dedicata alle notifiche
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Visualizza tutte le notifiche
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationManager