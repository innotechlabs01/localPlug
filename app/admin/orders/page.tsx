'use client'

import { useState, useEffect } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { RealtimeProvider } from '@/lib/admin/realtime-context'
import { formatDateTime, getToday, getLocalDatePart } from '@/lib/date-utils'

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
  status: string
  priority: string
  assigned_to: number | null
  driver_name: string | null
  driver_phone: string | null
  driver_vehicle: string | null
  driver_plate: string | null
  dispatch_status: string
  payment_status: string
  flight_number: string | null
  airline: string | null
  arrival_date: string | null
  arrival_time: string | null
  destination_address: string | null
  customer_notes: string | null
  created_at: string
  updated_at: string
  assigned_at: string | null
  history?: { status: string; timestamp: string; description: string }[]
}

type StatusFilter = 'all' | 'new' | 'confirmed' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'

function OrdersInner() {
  const { t } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showTodayOnly, setShowTodayOnly] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (searchQuery) params.set('search', searchQuery)

    adminFetch(`/api/admin/orders?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, searchQuery])

  const today = getToday()
  const filteredOrders = showTodayOnly
    ? orders.filter(o => getLocalDatePart(o.arrival_date || o.created_at) === today)
    : orders

  const openOrderDetail = async (order: Order) => {
    setDetailLoading(true)
    setSelectedOrder(order)
    try {
      const res = await adminFetch(`/api/admin/orders/${order.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedOrder(data)
      }
    } catch (err) {
      console.error('Failed to load order details:', err)
    }
    setDetailLoading(false)
  }

  const closeModal = () => {
    setSelectedOrder(null)
  }

  const statusColors: Record<string, string> = {
    new: 'bg-[rgba(59,130,246,0.12)] text-[var(--info)]',
    confirmed: 'bg-[rgba(16,185,129,0.12)] text-[var(--accent)]',
    in_progress: 'bg-[rgba(245,158,11,0.12)] text-[var(--warning)]',
    on_hold: 'bg-[rgba(245,158,11,0.12)] text-[var(--warning)]',
    completed: 'bg-[rgba(16,185,129,0.12)] text-[var(--accent)]',
    cancelled: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-[rgba(100,104,128,0.12)] text-[var(--fg-secondary)]',
    normal: 'bg-[rgba(59,130,246,0.12)] text-[var(--info)]',
    high: 'bg-[rgba(245,158,11,0.12)] text-[var(--warning)]',
    urgent: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  }

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--fg-secondary)]">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--fg)]">{t.admin.orders.title}</h1>
          <p className="text-[13px] text-[var(--fg-secondary)] mt-1">{t.admin.orders.subtitle}</p>
        </div>
        <button
          onClick={() => setShowTodayOnly(!showTodayOnly)}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${
            showTodayOnly
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--surface)] text-[var(--fg-muted)] border border-[var(--border)] hover:bg-[#202330]'
          }`}
        >
          {showTodayOnly ? 'Today Only' : 'All Dates'}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'new', 'confirmed', 'in_progress', 'on_hold', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-[6px] text-[13px] font-medium whitespace-nowrap transition-all ${statusFilter === status
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--fg-muted)] hover:bg-[#202330] border border-[var(--border)]'
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
            className="w-full px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[6px] text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-secondary)] outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>
        <span className="text-[12px] text-[var(--fg-secondary)] self-center">
          {orders.length} orders
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#111318] border-b border-[var(--border)]">
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.order}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.customer}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.package}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.flight}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.status}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.priority}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.payment}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--fg-secondary)] px-6 py-3">{t.admin.orders.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[#202330] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--fg)]">{order.order_number}</p>
                      <p className="text-[12px] text-[var(--fg-secondary)]">{order.booking_reference}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-[var(--fg-muted)]">{order.customer_name}</p>
                      <p className="text-[12px] text-[var(--fg-secondary)]">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-[var(--fg-muted)]">{order.package_name}</p>
                      <p className="text-[12px] text-[var(--fg-secondary)]">${order.package_price} USD</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-[var(--fg-muted)]">{order.flight_number || '-'}</p>
                      <p className="text-[12px] text-[var(--fg-secondary)]">{order.arrival_date || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[order.status]}`}>
                      {t.admin.orders.status[order.status as keyof typeof t.admin.orders.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${priorityColors[order.priority]}`}>
                      {t.admin.orders.priority[order.priority as keyof typeof t.admin.orders.priority] || order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${order.payment_status === 'completed' ? 'bg-[rgba(16,185,129,0.12)] text-[var(--accent)]' :
                        order.payment_status === 'pending' ? 'bg-[rgba(245,158,11,0.12)] text-[var(--warning)]' :
                          'bg-[rgba(239,68,80,0.12)] text-[#ef4450]'
                      }`}>
                      {t.admin.orders.payment[order.payment_status as keyof typeof t.admin.orders.payment] || order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="p-1.5 hover:bg-[#202330] rounded-[4px] text-[var(--fg-muted)] transition-all"
                      title="View details"
                      onClick={() => openOrderDetail(order)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-12 text-center text-[var(--fg-secondary)]">
            {t.admin.orders.noOrders}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--fg)]">{t.admin.orders.orderDetails || 'Order Details'}</h2>
                <p className="text-sm text-[var(--fg-secondary)]">{selectedOrder.order_number}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-[#202330] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              {/* Status Banner */}
              <div className="flex items-center gap-3 p-4 bg-[#202330] rounded-lg">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'completed' ? 'bg-[rgba(16,185,129,0.2)] text-[var(--accent)]' :
                    selectedOrder.status === 'cancelled' ? 'bg-[rgba(239,68,80,0.2)] text-[#ef4450]' :
                      'bg-[rgba(59,130,246,0.2)] text-[var(--info)]'
                  }`}>
                  {selectedOrder.status.toUpperCase()}
                </span>
                <span className="text-sm text-[var(--fg-muted)]">
                  {selectedOrder.dispatch_status !== 'pending' ? `Dispatch: ${selectedOrder.dispatch_status}` : ''}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-3 uppercase tracking-wide">{t.admin.orders.table.customer || 'Customer'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Name</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.customer_name}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Email</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.customer_email}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Phone</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.customer_phone || '-'}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Country</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.customer_country || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-3 uppercase tracking-wide">{t.admin.orders.table.package || 'Service'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Package</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.package_name}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Price</p>
                    <p className="text-sm text-[var(--fg)] font-semibold">${selectedOrder.package_price} {selectedOrder.currency?.toUpperCase()}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Flight</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.airline}{selectedOrder.flight_number || '-'}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[var(--fg-secondary)]">Arrival</p>
                    <p className="text-sm text-[var(--fg)]">{selectedOrder.arrival_date} {selectedOrder.arrival_time || ''}</p>
                  </div>
                </div>
              </div>

              {/* Driver Info (if assigned) */}
              {selectedOrder.assigned_to && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-3 uppercase tracking-wide">Driver</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-lg">
                      <p className="text-xs text-[var(--fg-secondary)]">Name</p>
                      <p className="text-sm text-[var(--accent)]">{selectedOrder.driver_name}</p>
                    </div>
                    <div className="p-3 bg-[#202330] rounded-lg">
                      <p className="text-xs text-[var(--fg-secondary)]">Vehicle</p>
                      <p className="text-sm text-[var(--fg)]">{selectedOrder.driver_vehicle} ({selectedOrder.driver_plate})</p>
                    </div>
                    <div className="p-3 bg-[#202330] rounded-lg col-span-2">
                      <p className="text-xs text-[var(--fg-secondary)]">Phone</p>
                      <p className="text-sm text-[var(--fg)]">{selectedOrder.driver_phone || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.customer_notes && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-3 uppercase tracking-wide">Notes</h3>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-sm text-[var(--fg-muted)]">{selectedOrder.customer_notes}</p>
                  </div>
                </div>
              )}

              {/* Timeline / History */}
              <div>
                <h3 className="text-sm font-medium text-[var(--fg-secondary)] mb-3 uppercase tracking-wide">{t.admin.orders.timeline || 'Timeline'}</h3>
                <div className="space-y-3">
                  {(selectedOrder.history || []).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${item.status === 'completed' ? 'bg-[var(--accent)]' :
                          item.status === 'cancelled' ? 'bg-[#ef4450]' :
                            item.status === 'assigned' ? 'bg-[var(--info)]' :
                              'bg-[var(--fg-secondary)]'
                        }`} />
                      <div className="flex-1">
                        <p className="text-sm text-[var(--fg)]">{item.description}</p>
                        <p className="text-xs text-[var(--fg-secondary)]">{formatDateTime(item.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.history || selectedOrder.history.length === 0) && (
                    <p className="text-sm text-[var(--fg-secondary)]">{t.admin.orders.noTimeline || 'No timeline available'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <RealtimeProvider>
      <I18nProvider>
        <OrdersInner />
      </I18nProvider>
    </RealtimeProvider>
  )
}
