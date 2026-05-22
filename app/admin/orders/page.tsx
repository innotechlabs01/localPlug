'use client'

import { useState, useEffect } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'

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

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (searchQuery) params.set('search', searchQuery)

    fetch(`/api/admin/orders?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, searchQuery])

  const openOrderDetail = async (order: Order) => {
    setDetailLoading(true)
    setSelectedOrder(order)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`)
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
    new: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
    confirmed: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
    in_progress: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
    on_hold: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
    completed: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
    cancelled: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
    normal: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
    high: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
    urgent: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  }

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5]">{t.admin.orders.title}</h1>
          <p className="text-[13px] text-[#646880] mt-1">{t.admin.orders.subtitle}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'new', 'confirmed', 'in_progress', 'on_hold', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-[6px] text-[13px] font-medium whitespace-nowrap transition-all ${statusFilter === status
                ? 'bg-[#10b981] text-white'
                : 'bg-[#181b25] text-[#9ca0b0] hover:bg-[#202330] border border-[#282b38]'
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
            className="w-full px-4 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
          />
        </div>
        <span className="text-[12px] text-[#646880] self-center">
          {orders.length} orders
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#111318] border-b border-[#282b38]">
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.order}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.customer}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.package}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.flight}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.status}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.priority}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.payment}</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#646880] px-6 py-3">{t.admin.orders.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#282b38] hover:bg-[#202330] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] font-medium text-[#f0f2f5]">{order.order_number}</p>
                      <p className="text-[12px] text-[#646880]">{order.booking_reference}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-[#9ca0b0]">{order.customer_name}</p>
                      <p className="text-[12px] text-[#646880]">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-[#9ca0b0]">{order.package_name}</p>
                      <p className="text-[12px] text-[#646880]">${order.package_price} USD</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-[#9ca0b0]">{order.flight_number || '-'}</p>
                      <p className="text-[12px] text-[#646880]">{order.arrival_date || '-'}</p>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${order.payment_status === 'completed' ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' :
                        order.payment_status === 'pending' ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]' :
                          'bg-[rgba(239,68,80,0.12)] text-[#ef4450]'
                      }`}>
                      {t.admin.orders.payment[order.payment_status as keyof typeof t.admin.orders.payment] || order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="p-1.5 hover:bg-[#202330] rounded-[4px] text-[#9ca0b0] transition-all"
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
          <div className="p-12 text-center text-[#646880]">
            {t.admin.orders.noOrders}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-[#181b25] border border-[#282b38] rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#282b38]">
              <div>
                <h2 className="text-lg font-semibold text-[#f0f2f5]">{t.admin.orders.orderDetails || 'Order Details'}</h2>
                <p className="text-sm text-[#646880]">{selectedOrder.order_number}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-[#202330] rounded-lg transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca0b0" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              {/* Status Banner */}
              <div className="flex items-center gap-3 p-4 bg-[#202330] rounded-lg">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'completed' ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981]' :
                    selectedOrder.status === 'cancelled' ? 'bg-[rgba(239,68,80,0.2)] text-[#ef4450]' :
                      'bg-[rgba(59,130,246,0.2)] text-[#3b82f6]'
                  }`}>
                  {selectedOrder.status.toUpperCase()}
                </span>
                <span className="text-sm text-[#9ca0b0]">
                  {selectedOrder.dispatch_status !== 'pending' ? `Dispatch: ${selectedOrder.dispatch_status}` : ''}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium text-[#646880] mb-3 uppercase tracking-wide">{t.admin.orders.table.customer || 'Customer'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Name</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.customer_name}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Email</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.customer_email}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Phone</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.customer_phone || '-'}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Country</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.customer_country || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="text-sm font-medium text-[#646880] mb-3 uppercase tracking-wide">{t.admin.orders.table.package || 'Service'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Package</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.package_name}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Price</p>
                    <p className="text-sm text-[#f0f2f5] font-semibold">${selectedOrder.package_price} {selectedOrder.currency?.toUpperCase()}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Flight</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.airline}{selectedOrder.flight_number || '-'}</p>
                  </div>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-xs text-[#646880]">Arrival</p>
                    <p className="text-sm text-[#f0f2f5]">{selectedOrder.arrival_date} {selectedOrder.arrival_time || ''}</p>
                  </div>
                </div>
              </div>

              {/* Driver Info (if assigned) */}
              {selectedOrder.assigned_to && (
                <div>
                  <h3 className="text-sm font-medium text-[#646880] mb-3 uppercase tracking-wide">Driver</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-lg">
                      <p className="text-xs text-[#646880]">Name</p>
                      <p className="text-sm text-[#10b981]">{selectedOrder.driver_name}</p>
                    </div>
                    <div className="p-3 bg-[#202330] rounded-lg">
                      <p className="text-xs text-[#646880]">Vehicle</p>
                      <p className="text-sm text-[#f0f2f5]">{selectedOrder.driver_vehicle} ({selectedOrder.driver_plate})</p>
                    </div>
                    <div className="p-3 bg-[#202330] rounded-lg col-span-2">
                      <p className="text-xs text-[#646880]">Phone</p>
                      <p className="text-sm text-[#f0f2f5]">{selectedOrder.driver_phone || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.customer_notes && (
                <div>
                  <h3 className="text-sm font-medium text-[#646880] mb-3 uppercase tracking-wide">Notes</h3>
                  <div className="p-3 bg-[#202330] rounded-lg">
                    <p className="text-sm text-[#9ca0b0]">{selectedOrder.customer_notes}</p>
                  </div>
                </div>
              )}

              {/* Timeline / History */}
              <div>
                <h3 className="text-sm font-medium text-[#646880] mb-3 uppercase tracking-wide">{t.admin.orders.timeline || 'Timeline'}</h3>
                <div className="space-y-3">
                  {(selectedOrder.history || []).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${item.status === 'completed' ? 'bg-[#10b981]' :
                          item.status === 'cancelled' ? 'bg-[#ef4450]' :
                            item.status === 'assigned' ? 'bg-[#3b82f6]' :
                              'bg-[#646880]'
                        }`} />
                      <div className="flex-1">
                        <p className="text-sm text-[#f0f2f5]">{item.description}</p>
                        <p className="text-xs text-[#646880]">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.history || selectedOrder.history.length === 0) && (
                    <p className="text-sm text-[#646880]">{t.admin.orders.noTimeline || 'No timeline available'}</p>
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
    <I18nProvider>
      <OrdersInner />
    </I18nProvider>
  )
}
