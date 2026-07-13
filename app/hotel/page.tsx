'use client'

import { useState, useEffect, useCallback } from 'react'

interface Order {
  id: number
  order_number: string
  booking_reference: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_country: string
  package_name: string
  package_price: number
  currency: string
  flight_number: string
  airline: string
  arrival_date: string
  arrival_time: string
  destination_address: string | null
  status: string
  dispatch_status: string
  payment_status: string
  created_at: string
}

type Tab = 'today' | 'checked_in' | 'all' | 'history'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  accepted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  checked_in: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function HotelPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab === 'today') {
        params.set('date', new Date().toISOString().split('T')[0])
      } else if (activeTab === 'checked_in') {
        params.set('status', 'checked_in')
      } else if (activeTab === 'history') {
        params.set('status', 'completed')
      }

      const res = await fetch(`/api/hotel/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Failed to fetch orders', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    setLoading(true)
    fetchOrders()
  }, [fetchOrders])

  const handleAction = async (orderId: number, action: string) => {
    setActionLoading(orderId)
    try {
      await fetch(`/api/hotel/orders/${orderId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await fetchOrders()
    } catch (err) {
      console.error(`Failed to ${action}`, err)
    } finally {
      setActionLoading(null)
    }
  }

  const getNextAction = (status: string): { action: string; label: string; color: string } | null => {
    switch (status) {
      case 'new':
        return { action: 'accept', label: 'Accept', color: 'bg-yellow-600 hover:bg-yellow-700' }
      case 'accepted':
        return { action: 'check-in', label: 'Check-In', color: 'bg-green-600 hover:bg-green-700' }
      case 'checked_in':
        return { action: 'check-out', label: 'Check-Out', color: 'bg-blue-600 hover:bg-blue-700' }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8a962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-[#c8a962] mb-6">
          Hotel Dashboard
        </h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['today', 'checked_in', 'all', 'history'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-[#c8a962] text-black'
                  : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'today' && 'Today'}
              {tab === 'checked_in' && 'Checked In'}
              {tab === 'all' && 'All Orders'}
              {tab === 'history' && 'History'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No orders found
            </div>
          ) : (
            orders.map(order => {
              const nextAction = getNextAction(order.status)
              return (
                <div
                  key={order.id}
                  className="p-4 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {order.status}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {order.order_number}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {order.arrival_date} {order.arrival_time}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mt-3">
                    <div>
                      <span className="text-gray-500">Client:</span>{' '}
                      {order.customer_name}
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>{' '}
                      {order.customer_phone}
                    </div>
                    <div>
                      <span className="text-gray-500">Flight:</span>{' '}
                      {order.airline} {order.flight_number}
                    </div>
                    <div>
                      <span className="text-gray-500">Package:</span>{' '}
                      {order.package_name}
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>{' '}
                      ${order.package_price} {order.currency?.toUpperCase()}
                    </div>
                    <div>
                      <span className="text-gray-500">Payment:</span>{' '}
                      {order.payment_status}
                    </div>
                    {order.destination_address && (
                      <div className="col-span-2 md:col-span-3">
                        <span className="text-gray-500">Destination:</span>{' '}
                        {order.destination_address}
                      </div>
                    )}
                  </div>

                  {nextAction && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleAction(order.id, nextAction.action)}
                        disabled={actionLoading === order.id}
                        className={`px-6 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50 ${nextAction.color}`}
                      >
                        {actionLoading === order.id ? 'Processing...' : nextAction.label}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
