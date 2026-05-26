'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'

interface RealtimeOrder {
  id: number; order_number: string | null; customer_name: string | null
  package_name: string | null; status: string; dispatch_status: string | null
  created_at: string
}

interface RealtimeConversation {
  id: number; user_name: string | null; status: string; priority: string
  channel: string; last_message_at: string | null; created_at: string
  last_message: string | null
}

interface RealtimeStats {
  new_orders: number; in_progress_orders: number
  pending_dispatch: number; assigned_dispatch: number
  escalated_conversations: number; active_conversations: number
  available_drivers: number; busy_drivers: number
}

interface RealtimeNotification {
  id: string; type: 'order' | 'conversation' | 'system'
  title: string; message: string; timestamp: string
  read: boolean
}

interface RealtimeContextValue {
  orders: RealtimeOrder[]
  conversations: RealtimeConversation[]
  stats: RealtimeStats
  notifications: RealtimeNotification[]
  unreadCount: number
  lastUpdate: string | null
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  refetch: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

const POLL_INTERVAL = 15_000 // 15 seconds

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<RealtimeOrder[]>([])
  const [conversations, setConversations] = useState<RealtimeConversation[]>([])
  const [stats, setStats] = useState<RealtimeStats>({
    new_orders: 0, in_progress_orders: 0,
    pending_dispatch: 0, assigned_dispatch: 0,
    escalated_conversations: 0, active_conversations: 0,
    available_drivers: 0, busy_drivers: 0,
  })
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const lastTimestampRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const failedRef = useRef(false)

  const fetchRealtime = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (lastTimestampRef.current) params.set('since', lastTimestampRef.current)

      const res = await fetch(`/api/admin/realtime?${params}`, { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) {
          failedRef.current = true
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
        return
      }

      const data = await res.json()

      // Detect new orders
      if (lastTimestampRef.current && data.orders?.length > 0) {
        const newOrders = data.orders.filter(
          (o: RealtimeOrder) => new Date(o.created_at) > new Date(lastTimestampRef.current!)
        )
        newOrders.forEach((order: RealtimeOrder) => {
          const notif: RealtimeNotification = {
            id: `order-${order.id}-${Date.now()}`,
            type: 'order',
            title: 'Nueva orden',
            message: `${order.customer_name || 'Cliente'} - ${order.package_name || order.order_number}`,
            timestamp: order.created_at,
            read: false,
          }
          setNotifications(prev => [notif, ...prev].slice(0, 50))
        })
      }

      // Detect escalated conversations
      if (lastTimestampRef.current && data.conversations?.length > 0) {
        const newConvos = data.conversations.filter(
          (c: RealtimeConversation) => c.status === 'escalated' &&
            (!lastTimestampRef.current || new Date(c.last_message_at || c.created_at) > new Date(lastTimestampRef.current))
        )
        newConvos.forEach((convo: RealtimeConversation) => {
          const notif: RealtimeNotification = {
            id: `convo-${convo.id}-${Date.now()}`,
            type: 'conversation',
            title: 'Conversación escalada',
            message: `${convo.user_name || 'Usuario'} - ${convo.last_message?.slice(0, 50) || '...'}`,
            timestamp: convo.last_message_at || convo.created_at,
            read: false,
          }
          setNotifications(prev => [notif, ...prev].slice(0, 50))
        })
      }

      setOrders(data.orders || [])
      setConversations(data.conversations || [])
      setStats(data.stats || stats)
      lastTimestampRef.current = data.timestamp || new Date().toISOString()
      setLastUpdate(data.timestamp)
    } catch (err) {
      console.error('[Realtime] Fetch error:', err)
    }
  }, [])

  // Start polling
  useEffect(() => {
    fetchRealtime()

    const start = () => {
      stop()
      intervalRef.current = setInterval(() => {
        if (!document.hidden) fetchRealtime()
      }, POLL_INTERVAL)
    }

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchRealtime()
        start()
      } else {
        stop()
      }
    }

    const onFocus = () => fetchRealtime()

    start()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchRealtime])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <RealtimeContext.Provider value={{
      orders,
      conversations,
      stats,
      notifications,
      unreadCount,
      lastUpdate,
      markAsRead,
      markAllAsRead,
      refetch: fetchRealtime,
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  return ctx ?? {
    orders: [],
    conversations: [],
    stats: { new_orders: 0, in_progress_orders: 0, pending_dispatch: 0, assigned_dispatch: 0, escalated_conversations: 0, active_conversations: 0, available_drivers: 0, busy_drivers: 0 },
    notifications: [],
    unreadCount: 0,
    lastUpdate: null,
    markAsRead: () => {},
    markAllAsRead: () => {},
    refetch: async () => {},
  }
}
