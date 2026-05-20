'use client'

import { useState, useEffect } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'

interface Order {
  id: number
  order_number: string
  booking_reference: string
  customer_name: string
  customer_email: string
  package_name: string
  package_price: number
  status: string
  priority: string
  assigned_to: number | null
  payment_status: string
  flight_number: string | null
  arrival_date: string | null
  created_at: string
  updated_at: string
}

type StatusFilter = 'all' | 'new' | 'confirmed' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent'

function OrdersInner() {
  const { t } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)
    if (searchQuery) params.set('search', searchQuery)

    fetch(`/api/admin/orders?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, priorityFilter, searchQuery])

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    on_hold: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-cool-slate-100 text-cool-slate-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  }

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cool-slate-500">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg text-slate-navy">{t.admin.orders.title}</h1>
          <p className="text-body-md text-cool-slate-500 mt-1">{t.admin.orders.subtitle}</p>
        </div>
        <button className="px-4 py-2 bg-mountain-emerald text-white rounded-lg hover:bg-mountain-emerald/90 transition-colors text-label-md">
          {t.admin.orders.newOrder}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'new', 'confirmed', 'in_progress', 'on_hold', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-label-md whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-slate-navy text-white'
                : 'bg-white text-cool-slate-600 hover:bg-cool-slate-100 border border-cool-slate-200'
            }`}
          >
            {t.admin.orders.status[status]}
            {status !== 'all' && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {statusCounts[status] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t.admin.orders.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-cool-slate-200 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-mountain-emerald/20 focus:border-mountain-emerald"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
          className="px-4 py-2 border border-cool-slate-200 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-mountain-emerald/20 focus:border-mountain-emerald"
        >
          <option value="all">{t.admin.orders.allPriorities}</option>
          <option value="low">{t.admin.orders.priority.low}</option>
          <option value="normal">{t.admin.orders.priority.normal}</option>
          <option value="high">{t.admin.orders.priority.high}</option>
          <option value="urgent">{t.admin.orders.priority.urgent}</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-cool-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-cool-slate-50 border-b border-cool-slate-100">
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.order}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.customer}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.package}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.flight}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.status}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.priority}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.payment}</th>
                <th className="text-left text-label-sm text-cool-slate-500 font-medium px-6 py-3">{t.admin.orders.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-cool-slate-50 hover:bg-cool-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-label-md text-slate-navy font-medium">{order.order_number}</p>
                      <p className="text-body-sm text-cool-slate-400">{order.booking_reference}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body-md text-cool-slate-600">{order.customer_name}</p>
                      <p className="text-body-sm text-cool-slate-400">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body-md text-cool-slate-600">{order.package_name}</p>
                      <p className="text-body-sm text-cool-slate-400">${order.package_price} USD</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body-md text-cool-slate-600">{order.flight_number || '-'}</p>
                      <p className="text-body-sm text-cool-slate-400">{order.arrival_date || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium ${statusColors[order.status]}`}>
                      {t.admin.orders.status[order.status as keyof typeof t.admin.orders.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium ${priorityColors[order.priority]}`}>
                      {t.admin.orders.priority[order.priority as keyof typeof t.admin.orders.priority] || order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium ${
                      order.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t.admin.orders.payment[order.payment_status as keyof typeof t.admin.orders.payment] || order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-cool-slate-100 rounded-lg transition-colors" title="View details">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="p-1.5 hover:bg-cool-slate-100 rounded-lg transition-colors" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-12 text-center text-cool-slate-500">
            {t.admin.orders.noOrders}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <I18nProvider>
      <OrdersInner />
    </I18nProvider>
  )
}
