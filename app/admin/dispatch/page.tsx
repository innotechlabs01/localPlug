'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { usePolling } from './use-polling'

// ── Types ──
interface Driver {
  id: number; name: string; phone: string | null; photo: string | null
  vehicle: string; plate: string; category: string; status: string
  rating: number; languages: string; experience_level: string
  total_trips: number; vip_compatible: number; notes: string | null
}

interface Order {
  id: number; order_number: string | null; customer_name: string | null
  customer_phone: string | null; customer_country: string | null
  customer_email: string | null; flight_number: string | null; airline: string | null
  arrival_date: string | null; arrival_time: string | null
  destination_address: string | null; package_name: string | null
  priority: string | null; status: string; dispatch_status: string | null
  assigned_to: number | null; driver_name: string | null; driver_vehicle: string | null
  payment_status: string | null; customer_notes: string | null; created_at: string
}

interface DispatchData {
  orders: Order[]; drivers: Driver[]; counts: { pending: number; assigned: number; enroute: number; pickedup: number }
}

const theme = {
  bg: '#0b0d14', surface: '#181b25', surfaceHover: '#202330', border: '#282b38', borderLight: '#1e2130',
  fg: '#f0f2f5', fgSecondary: '#9ca0b0', fgMuted: '#646880',
  accent: '#10b981', accentSoft: 'rgba(16,185,129,0.12)', accentGlow: 'rgba(16,185,129,0.2)',
  warning: '#f59e0b', warningSoft: 'rgba(245,158,11,0.12)',
  danger: '#ef4450', dangerSoft: 'rgba(239,68,80,0.12)',
  info: '#3b82f6', infoSoft: 'rgba(59,130,246,0.12)',
  gold: '#d4a84b', goldSoft: 'rgba(212,168,75,0.15)',
  radiusSm: '6px', radiusMd: '10px', fontMono: "'JetBrains Mono', ui-monospace, monospace",
}

const dispatchStatuses = ['pending', 'assigned', 'enroute', 'pickedup', 'completed'] as const

export default function DispatchPage() {
  const { t } = useI18n()
  const [data, setData] = useState<DispatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [driverCat, setDriverCat] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDriverId, setModalDriverId] = useState<number | null>(null)
  const [assignedDrivers, setAssignedDrivers] = useState<Record<number, number>>({})
  const [notifications, setNotifications] = useState<{ id: number; type: string; title: string; desc: string }[]>([])

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ tab, driverCat })
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/admin/dispatch?${params}`)
      const d: DispatchData = await res.json()
      setData(d)
      // Track assigned drivers
      const map: Record<number, number> = {}
      for (const o of d.orders) {
        if (o.assigned_to) map[o.id] = o.assigned_to
      }
      setAssignedDrivers(map)
    } catch (err) {
      console.error('Failed to fetch dispatch data', err)
    }
    setLoading(false)
  }, [tab, search, driverCat])

  useEffect(() => { fetchData() }, [fetchData])
  usePolling(fetchData, { intervalMs: 10_000 })

  const addNotif = (type: string, title: string, desc: string) => {
    const id = Date.now()
    setNotifications(p => [...p, { id, type, title, desc }])
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000)
  }

  const selectedOrder = useMemo(() => data?.orders.find(o => o.id === selectedId) || null, [data, selectedId])
  const selectedDriver = useMemo(() => data?.drivers.find(d => d.id === modalDriverId) || null, [data, modalDriverId])

  const suggestedDrivers = useMemo(() =>
    data?.drivers.filter(d => {
      if (d.status !== 'available') return false
      if (selectedOrder?.priority === 'urgent' && d.experience_level !== 'Senior') return false
      return true
    }) || [],
    [data, selectedOrder]
  )

  const otherDrivers = useMemo(() =>
    data?.drivers.filter(d => d.status === 'available' && !suggestedDrivers.find(s => s.id === d.id)) || [],
    [data, suggestedDrivers]
  )

  const doAssign = async (orderId: number, driverId: number) => {
    const res = await fetch('/api/admin/dispatch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', orderId, driverId }),
    })
    if (res.ok) {
      addNotif('assign', 'Driver Assigned', `Driver assigned to order #${orderId}`)
      setAssignedDrivers(p => ({ ...p, [orderId]: driverId }))
      setModalOpen(false)
      fetchData()
    }
  }

  const doUnassign = async (orderId: number) => {
    const res = await fetch('/api/admin/dispatch', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unassign', orderId }),
    })
    if (res.ok) {
      addNotif('unassign', 'Driver Unassigned', `Order #${orderId} is now pending`)
      const newMap = { ...assignedDrivers }
      delete newMap[orderId]
      setAssignedDrivers(newMap)
      fetchData()
    }
  }

  const doStatus = async (orderId: number, status: string) => {
    const res = await fetch('/api/admin/dispatch', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', orderId, status }),
    })
    if (res.ok) {
      addNotif('status', `Status → ${status}`, `Order #${orderId} updated`)
      fetchData()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[#646880]">Loading dispatch center...</div>
  }

  const orders = data?.orders || []
  const drivers = data?.drivers || []
  const counts = data?.counts || { pending: 0, assigned: 0, enroute: 0, pickedup: 0 }

  const getStatusStep = (status: string | null) => dispatchStatuses.indexOf((status || 'pending') as typeof dispatchStatuses[number])

  const filteredOrders = useMemo(() => {
    let list = orders
    if (tab === 'pending') list = list.filter(o => (o.dispatch_status || 'pending') === 'pending')
    else if (tab === 'assigned') list = list.filter(o => o.dispatch_status === 'assigned')
    else if (tab === 'enroute') list = list.filter(o => o.dispatch_status === 'enroute')
    else if (tab === 'completed') list = list.filter(o => o.dispatch_status === 'completed')
    else if (tab === 'vip') list = list.filter(o => o.priority === 'high' || o.priority === 'urgent')
    else if (tab === 'unassigned') list = list.filter(o => !o.assigned_to)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(o =>
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.flight_number || '').toLowerCase().includes(q) ||
        (o.destination_address || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, tab, query])

  const isVip = (o: Order) => o.priority === 'high' || o.priority === 'urgent'

  return (
    <>
      <style>{`
        .dispatch-layout {
          display: grid;
          grid-template-columns: 380px 1fr 400px;
          gap: 0;
          height: calc(100vh - 60px);
          overflow: hidden;
        }
        .dispatch-panel { overflow-y: auto; height: 100%; }
        .dispatch-panel::-webkit-scrollbar { width: 4px; }
        .dispatch-panel::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
        .dispatch-left { border-right: 1px solid ${theme.border}; background: ${theme.bg}; }
        .dispatch-center { background: ${theme.surface}; }
        .dispatch-right { border-left: 1px solid ${theme.border}; background: ${theme.bg}; }
        
        .dp-header {
          padding: 16px 16px 12px; border-bottom: 1px solid ${theme.borderLight};
          display: flex; align-items: center; justify-content: space-between;
        }
        .dp-header-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .dp-header-count { font-size: 11px; color: ${theme.fgMuted}; background: ${theme.surface}; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
        
        .dp-search-bar { margin: 12px 16px; position: relative; }
        .dp-search-bar input {
          width: 100%; padding: 8px 12px 8px 34px; background: ${theme.bg};
          border: 1px solid ${theme.border}; border-radius: ${theme.radiusSm};
          color: ${theme.fg}; font-size: 13px; outline: none;
        }
        .dp-search-bar input:focus { border-color: ${theme.accent}; box-shadow: 0 0 0 3px ${theme.accentSoft}; }
        .dp-search-bar svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: ${theme.fgMuted}; }
        
        .dp-filter-tabs { display: flex; gap: 4px; margin: 0 16px 12px; overflow-x: auto; }
        .dp-filter-tab {
          padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: transparent; color: ${theme.fgMuted}; border: 1px solid ${theme.border};
          cursor: pointer; white-space: nowrap; transition: all 200ms;
        }
        .dp-filter-tab:hover { border-color: ${theme.fgMuted}; color: ${theme.fgSecondary}; }
        .dp-filter-tab.active { background: ${theme.accentSoft}; color: ${theme.accent}; border-color: ${theme.accent}; }
        
        .dp-request-list { padding: 0 8px 16px; }
        .dp-request-card {
          display: grid; grid-template-columns: 4px 1fr auto; gap: 12px;
          padding: 12px 12px 12px 0; border-radius: ${theme.radiusSm};
          cursor: pointer; transition: all 200ms;
        }
        .dp-request-card:hover { background: ${theme.surfaceHover}; }
        .dp-request-card.selected { background: ${theme.accentSoft}; }
        .dp-request-priority { width: 4px; border-radius: 2px; align-self: stretch; }
        .dp-request-priority.high { background: ${theme.danger}; }
        .dp-request-priority.medium { background: ${theme.warning}; }
        .dp-request-priority.low { background: ${theme.accent}; }
        .dp-request-name { font-size: 13px; font-weight: 600; color: ${theme.fg}; display: flex; align-items: center; gap: 6px; }
        .dp-request-meta { font-size: 11px; color: ${theme.fgMuted}; margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .dp-request-flight { font-family: ${theme.fontMono}; background: ${theme.surface}; padding: 0 5px; border-radius: 3px; font-size: 10px; }
        .dp-request-right { text-align: right; }
        .dp-request-time { font-size: 12px; font-weight: 600; color: ${theme.fg}; font-family: ${theme.fontMono}; }
        .dp-request-status { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 8px; }
        .dp-vip-badge {
          display: inline-flex; align-items: center; gap: 3px;
          background: ${theme.goldSoft}; color: ${theme.gold};
          font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 6px;
          text-transform: uppercase; letter-spacing: 0.3px;
        }
        .dp-payment-badge { font-size: 10px; font-weight: 500; }
        .dp-payment-badge.paid { color: ${theme.accent}; }
        .dp-payment-badge.pending { color: ${theme.warning}; }
        
        /* Center Panel */
        .dp-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: ${theme.fgMuted}; }
        .dp-detail-header { padding: 20px 24px; border-bottom: 1px solid ${theme.borderLight}; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .dp-detail-guest { display: flex; align-items: center; gap: 14px; }
        .dp-detail-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, ${theme.accent}, #059669);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 600; font-size: 16px; flex-shrink: 0;
        }
        .dp-detail-guest-info h2 { font-size: 18px; font-weight: 600; }
        .dp-detail-guest-info .guest-sub { font-size: 12px; color: ${theme.fgMuted}; display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .dp-detail-actions { display: flex; gap: 8px; }
        
        .dp-timeline-bar { display: flex; align-items: center; gap: 0; padding: 16px 24px; border-bottom: 1px solid ${theme.borderLight}; overflow-x: auto; }
        .dp-timeline-step { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dp-timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: ${theme.border}; flex-shrink: 0; }
        .dp-timeline-dot.completed { background: ${theme.accent}; box-shadow: 0 0 6px ${theme.accentGlow}; }
        .dp-timeline-dot.active { background: ${theme.info}; box-shadow: 0 0 8px rgba(59,130,246,0.4); animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100% { transform: scale(1); } 50% { transform: scale(1.3); } }
        .dp-timeline-label { font-size: 10px; color: ${theme.fgMuted}; white-space: nowrap; font-weight: 500; }
        .dp-timeline-label.completed { color: ${theme.accent}; }
        .dp-timeline-label.active { color: ${theme.info}; }
        .dp-timeline-connector { width: 24px; height: 2px; background: ${theme.border}; margin: 0 4px; flex-shrink: 0; }
        .dp-timeline-connector.completed { background: ${theme.accent}; }
        
        .dp-detail-sections { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 20px; }
        .dp-section-card { background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: ${theme.radiusMd}; overflow: hidden; }
        .dp-section-header { padding: 12px 16px; border-bottom: 1px solid ${theme.borderLight}; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .dp-section-body { padding: 16px; }
        .dp-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dp-info-item { display: flex; flex-direction: column; gap: 2px; }
        .dp-info-label { font-size: 10px; color: ${theme.fgMuted}; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
        .dp-info-value { font-size: 13px; font-weight: 500; color: ${theme.fg}; }
        .dp-info-value.mono { font-family: ${theme.fontMono}; font-size: 12px; }
        .dp-note-text { font-size: 13px; color: ${theme.fgSecondary}; line-height: 1.6; padding: 10px 12px; background: ${theme.bg}; border-radius: ${theme.radiusSm}; border-left: 3px solid ${theme.accent}; }
        
        .dp-suggested-label { font-size: 11px; font-weight: 600; color: ${theme.accent}; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
        .dp-driver-suggestion {
          display: flex; align-items: center; gap: 12px; padding: 12px;
          background: ${theme.accentSoft}; border: 1px solid ${theme.accent};
          border-radius: ${theme.radiusSm}; margin-bottom: 8px; cursor: pointer;
        }
        .dp-driver-suggestion .d-photo { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${theme.accent}, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0; }
        .dp-driver-suggestion .d-info { flex: 1; min-width: 0; }
        .dp-driver-suggestion .d-name { font-size: 13px; font-weight: 600; }
        .dp-driver-suggestion .d-detail { font-size: 11px; color: ${theme.fgMuted}; display: flex; align-items: center; gap: 6px; margin-top: 1px; }
        .dp-driver-suggestion .d-badge { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 8px; }
        .dp-driver-suggestion .d-badge.match { background: ${theme.accentSoft}; color: ${theme.accent}; }
        
        .dp-other-label { font-size: 11px; color: ${theme.fgMuted}; font-weight: 500; margin-bottom: 8px; }
        .dp-other-driver { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: ${theme.bg}; border: 1px solid ${theme.borderLight}; border-radius: ${theme.radiusSm}; margin-bottom: 6px; cursor: pointer; }
        .dp-other-driver:hover { background: ${theme.surfaceHover}; border-color: ${theme.border}; }
        .dp-other-driver .d-photo { width: 34px; height: 34px; border-radius: 50%; background: ${theme.surfaceHover}; display: flex; align-items: center; justify-content: center; color: ${theme.fgSecondary}; font-weight: 600; font-size: 12px; flex-shrink: 0; }
        
        .dp-assign-btn { margin-top: 12px; width: 100%; padding: 10px; background: ${theme.accent}; color: white; border: none; border-radius: ${theme.radiusSm}; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .dp-assign-btn:hover { background: #059669; box-shadow: 0 0 20px ${theme.accentGlow}; }
        .dp-assign-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        
        /* Right panel */
        .dp-cat-tabs { display: flex; gap: 4px; margin: 12px 16px; flex-wrap: wrap; }
        .dp-cat-tab { padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 500; background: transparent; color: ${theme.fgMuted}; border: 1px solid ${theme.border}; cursor: pointer; white-space: nowrap; }
        .dp-cat-tab:hover { border-color: ${theme.fgMuted}; }
        .dp-cat-tab.active { background: ${theme.accentSoft}; color: ${theme.accent}; border-color: ${theme.accent}; }
        
        .dp-driver-list { padding: 0 12px 16px; }
        .dp-driver-card {
          display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; padding: 12px;
          background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: ${theme.radiusMd};
          margin-bottom: 8px; cursor: grab;
        }
        .dp-driver-card:hover { border-color: ${theme.accent}; box-shadow: 0 0 0 1px ${theme.accentSoft}; }
        .dp-driver-card.suggested { border-color: ${theme.accent}; background: ${theme.accentSoft}; }
        .dp-driver-card.unavailable { opacity: 0.5; cursor: not-allowed; }
        .dp-driver-card.assigned { border-color: ${theme.info}; background: ${theme.infoSoft}; opacity: 0.65; }
        
        .dp-driver-photo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, ${theme.accent}, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 15px; flex-shrink: 0; position: relative; }
        .dp-driver-photo .status-ring { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid ${theme.surface}; }
        .dp-driver-photo .status-ring.online { background: ${theme.accent}; }
        .dp-driver-photo .status-ring.offline { background: ${theme.fgMuted}; }
        .dp-driver-photo .status-ring.busy { background: ${theme.warning}; }
        
        .dp-driver-info { min-width: 0; }
        .dp-driver-name { font-size: 13px; font-weight: 600; color: ${theme.fg}; display: flex; align-items: center; gap: 6px; }
        .dp-driver-detail { font-size: 11px; color: ${theme.fgMuted}; margin-top: 2px; }
        .dp-driver-right { text-align: right; }
        .dp-driver-stat { font-size: 12px; font-weight: 600; font-family: ${theme.fontMono}; color: ${theme.fg}; }
        
        .notif-stack { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 2000; }
        .notif-card { background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: ${theme.radiusMd}; padding: 12px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); min-width: 260px; animation: slideUp 300ms ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .notif-title { font-size: 12px; font-weight: 600; }
        .notif-desc { font-size: 11px; color: ${theme.fgSecondary}; margin-top: 2px; }
        
        .dp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .dp-modal { background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: ${theme.radiusMd}; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .dp-modal-header { padding: 20px 24px 0; display: flex; align-items: center; justify-content: space-between; }
        .dp-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
        .dp-modal-footer { padding: 0 24px 20px; display: flex; gap: 8px; justify-content: flex-end; }
        
        .gp { font-family: ${theme.fontMono}; background: ${theme.surface}; padding: 0 5px; border-radius: 3px; font-size: 10px; }
      `}</style>

      <div className="dispatch-layout">
        {/* ── Left Panel: Requests ── */}
        <div className="dispatch-panel dispatch-left">
          <div className="dp-header">
            <div className="dp-header-title">
              Requests
              <span className="dp-header-count">{orders.length}</span>
            </div>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: theme.fgSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px' }} title="Refresh">↻</button>
          </div>

          <div className="dp-search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input placeholder="Search name, flight, hotel..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          <div className="dp-filter-tabs">
            {(['all', 'pending', 'assigned', 'enroute', 'pickedup', 'completed', 'vip'] as const).map(t => (
              <button key={t} className={`dp-filter-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="dp-request-list">
            {filteredOrders.length === 0 ? (
              <div className="dp-empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                </svg>
                <p style={{ fontSize: 13 }}>No requests match the current filter.</p>
              </div>
            ) : filteredOrders.map(order => (
              <div
                key={order.id}
                className={`dp-request-card ${order.id === selectedId ? 'selected' : ''}`}
                onClick={() => setSelectedId(order.id)}
              >
                <div className={`dp-request-priority ${order.priority === 'urgent' ? 'high' : order.priority === 'high' ? 'medium' : 'low'}`} />
                <div className="dp-request-body">
                  <div className="dp-request-name">
                    {order.customer_name || 'Guest'}
                    {isVip(order) && <span className="dp-vip-badge">VIP</span>}
                    {order.assigned_to && <span className="dp-flight" style={{ fontFamily: theme.fontMono, background: theme.surface, padding: '0 5px', borderRadius: 3, fontSize: 10, color: theme.info }}>#{order.id}</span>}
                  </div>
                  <div className="dp-request-meta">
                    {order.flight_number && <span className="dp-request-flight">{order.flight_number}</span>}
                    <span>{order.airline || ''}</span>
                    <span>·</span>
                    <span>{order.package_name || ''}</span>
                    {order.destination_address && <><span>·</span><span>{order.destination_address}</span></>}
                  </div>
                </div>
                <div className="dp-request-right">
                  <div className="dp-request-time">{order.arrival_time?.substring(0, 5) || '--:--'}</div>
                  <span className={`dp-request-status ${order.dispatch_status || 'pending'}`}
                    style={{
                      background: order.dispatch_status === 'assigned' ? theme.accentSoft : order.dispatch_status === 'enroute' ? theme.infoSoft : order.dispatch_status === 'pickedup' ? 'rgba(139,92,246,0.12)' : order.dispatch_status === 'completed' ? theme.accentSoft : theme.warningSoft,
                      color: order.dispatch_status === 'assigned' ? theme.accent : order.dispatch_status === 'enroute' ? theme.info : order.dispatch_status === 'pickedup' ? '#8b5cf6' : order.dispatch_status === 'completed' ? theme.accent : theme.warning,
                    }}>
                    {(order.dispatch_status || 'pending').charAt(0).toUpperCase() + (order.dispatch_status || 'pending').slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center Panel: Detail View ── */}
        <div className="dispatch-panel dispatch-center">
          {!selectedOrder ? (
            <div className="dp-empty-state" style={{ padding: 24, textAlign: 'center', color: theme.fgMuted }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.fgSecondary }}>Select a Request</h3>
              <p style={{ fontSize: 13, maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>Choose a request from the left panel to view details and assign a driver.</p>
            </div>
          ) : (
            <>
              <div className="dp-detail-header">
                <div className="dp-detail-guest">
                  <div className="dp-detail-avatar">
                    {(selectedOrder.customer_name || 'G')[0]}
                  </div>
                  <div className="dp-detail-guest-info">
                    <h2>{selectedOrder.customer_name || 'Guest'}</h2>
                    <div className="guest-sub">
                      <span>{selectedOrder.customer_country || ''}</span>
                      {selectedOrder.customer_phone && <><span>·</span><span>{selectedOrder.customer_phone}</span></>}
                    </div>
                  </div>
                </div>
                <div className="dp-detail-actions">
                  {selectedOrder.assigned_to ? (
                    <button className="dp-assign-btn" style={{ width: 'auto', padding: '8px 14px', fontSize: 12, background: theme.bg, color: theme.danger, border: `1px solid ${theme.danger}` }}
                      onClick={() => doUnassign(selectedOrder.id)}>
                      Unassign
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Timeline */}
              <div className="dp-timeline-bar">
                {dispatchStatuses.map((s, i) => {
                  const currentStep = getStatusStep(selectedOrder.dispatch_status)
                  const completed = i <= currentStep
                  const active = i === currentStep
                  return (
                    <div key={s} className="dp-timeline-step">
                      <div>
                        <div className={`dp-timeline-dot ${completed && (s === 'completed' || currentStep === dispatchStatuses.length - 1) ? 'completed' : active ? 'active' : ''}`} />
                        <div className={`dp-timeline-label ${completed && (s === 'completed' || currentStep === dispatchStatuses.length - 1) ? 'completed' : active ? 'active' : ''}`}>
                          {s === 'pickedup' ? 'Pickup' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </div>
                      </div>
                      {i < dispatchStatuses.length - 1 && <div className={`dp-timeline-connector ${completed ? 'completed' : ''}`} />}
                    </div>
                  )
                })}
              </div>

              <div className="dp-detail-sections">
                {/* Flight & Service */}
                <div className="dp-section-card">
                  <div className="dp-section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5"/><path d="M18 12v5"/><path d="M10 14l2 1 2-1"/>
                    </svg>
                    Flight & Service
                  </div>
                  <div className="dp-section-body">
                    <div className="dp-info-grid">
                      <div className="dp-info-item"><span className="dp-info-label">Flight</span><span className="dp-info-value mono">{selectedOrder.flight_number || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Airline</span><span className="dp-info-value">{selectedOrder.airline || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Arrival</span><span className="dp-info-value mono">{selectedOrder.arrival_date} {selectedOrder.arrival_time || ''}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Service</span><span className="dp-info-value">{selectedOrder.package_name || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Destination</span><span className="dp-info-value">{selectedOrder.destination_address || '—'}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Priority</span><span className="dp-info-value" style={{ color: selectedOrder.priority === 'urgent' ? theme.danger : selectedOrder.priority === 'high' ? theme.warning : theme.fg }}>{selectedOrder.priority || 'Normal'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="dp-section-card">
                  <div className="dp-section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    Payment
                  </div>
                  <div className="dp-section-body">
                    <div className="dp-info-grid">
                      <div className="dp-info-item"><span className="dp-info-label">Status</span><span className={`dp-payment-badge ${selectedOrder.payment_status || 'pending'}`}>{(selectedOrder.payment_status || 'pending').toUpperCase()}</span></div>
                      <div className="dp-info-item"><span className="dp-info-label">Customer</span><span className="dp-info-value">{selectedOrder.customer_email || '—'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.customer_notes && (
                  <div className="dp-section-card">
                    <div className="dp-section-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Notes
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-note-text">{selectedOrder.customer_notes}</div>
                    </div>
                  </div>
                )}

                {/* Assign Driver Section */}
                {!selectedOrder.assigned_to && (
                  <div className="dp-section-card">
                    <div className="dp-section-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 17h2l-2-6H5l-2 6h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11l1.5-4h11L19 11"/>
                      </svg>
                      Assign Driver
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-assign-area">
                        {suggestedDrivers.length > 0 && (
                          <>
                            <div className="dp-suggested-label">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              Suggested
                            </div>
                            {suggestedDrivers.slice(0, 3).map(d => (
                              <div key={d.id} className="dp-driver-suggestion" onClick={() => setModalOpen(true) || setModalDriverId(d.id)}>
                                <div className="d-photo">{d.name[0]}</div>
                                <div className="d-info">
                                  <div className="d-name">{d.name}</div>
                                  <div className="d-detail">{d.vehicle} · {d.languages}</div>
                                </div>
                                <span className="d-badge match">{d.experience_level}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {otherDrivers.length > 0 && (
                          <>
                            <div className="dp-other-label" style={{ marginTop: suggestedDrivers.length > 0 ? 12 : 0 }}>
                              {suggestedDrivers.length > 0 ? 'Other available drivers' : 'Available drivers'}
                            </div>
                            {otherDrivers.slice(0, 3).map(d => (
                              <div key={d.id} className="dp-other-driver" onClick={() => { setModalOpen(true); setModalDriverId(d.id) }}>
                                <div className="d-photo">{d.name[0]}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
                                  <div style={{ fontSize: 11, color: theme.fgMuted, marginTop: 1 }}>{d.vehicle} · {d.languages}</div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        <button className="dp-assign-btn" onClick={() => setModalOpen(true)} disabled={drivers.filter(d => d.status === 'available').length === 0}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                          {drivers.filter(d => d.status === 'available').length > 0 ? 'Assign a driver' : 'No drivers available'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Info (if assigned) */}
                {selectedOrder.assigned_to && selectedOrder.driver_name && (
                  <div className="dp-section-card">
                    <div className="dp-section-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2"/><circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/>
                      </svg>
                      Driver
                    </div>
                    <div className="dp-section-body">
                      <div className="dp-info-grid">
                        <div className="dp-info-item"><span className="dp-info-label">Name</span><span className="dp-info-value" style={{ color: theme.accent }}>{selectedOrder.driver_name}</span></div>
                        <div className="dp-info-item"><span className="dp-info-label">Vehicle</span><span className="dp-info-value">{selectedOrder.driver_vehicle || '—'}</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {['enroute', 'pickedup', 'completed'].map(s => (
                          <button key={s} className="dp-assign-btn" style={{ width: 'auto', padding: '6px 12px', fontSize: 11, background: theme.surface, color: theme.fg, border: `1px solid ${theme.border}` }}
                            onClick={() => doStatus(selectedOrder.id, s)}>
                            Mark {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel: Drivers ── */}
        <div className="dispatch-panel dispatch-right">
          <div className="dp-header">
            <div className="dp-header-title">
              Drivers
              <span className="dp-header-count">{drivers.length}</span>
            </div>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: theme.fgSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px' }}>↻</button>
          </div>

          <div className="dp-cat-tabs">
            {['all', 'standard', 'suv', 'vip', 'luxury', 'van'].map(cat => (
              <button key={cat} className={`dp-cat-tab ${driverCat === cat ? 'active' : ''}`} onClick={() => setDriverCat(cat)}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="dp-driver-list">
            {drivers.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: theme.fgMuted, fontSize: 13 }}>
                No drivers registered yet
              </div>
            ) : drivers.map(d => {
              const isSuggested = selectedOrder && suggestedDrivers.find(s => s.id === d.id)
              const isAssigned = assignedDrivers && Object.values(assignedDrivers).includes(d.id)
              const isUnavailable = d.status !== 'available'
              return (
                <div
                  key={d.id}
                  className={`dp-driver-card ${isSuggested && selectedOrder ? 'suggested' : ''} ${isAssigned ? 'assigned' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                  onClick={() => { if (selectedOrder && !isUnavailable) { setModalDriverId(d.id); setModalOpen(true) } }}
                >
                  <div className="dp-driver-photo">
                    {d.name[0]}
                    <span className={`status-ring ${d.status}`} />
                  </div>
                  <div className="dp-driver-info">
                    <div className="dp-driver-name">
                      {d.name}
                      {d.vip_compatible ? <span style={{ fontSize: 9, color: theme.gold }}>VIP</span> : null}
                    </div>
                    <div className="dp-driver-detail">{d.vehicle} · {d.plate} · {d.languages}</div>
                  </div>
                  <div className="dp-driver-right">
                    <div className="dp-driver-stat">★ {d.rating}</div>
                    <div style={{ fontSize: 10, color: theme.fgMuted }}>{d.total_trips} trips</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Assign Modal ── */}
      {modalOpen && (
        <div className="dp-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-header">
              <span style={{ fontSize: 16, fontWeight: 600, color: theme.fg }}>Assign Driver</span>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: theme.fgSecondary, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div className="dp-modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.borderLight}`, fontSize: 13 }}>
                <span style={{ color: theme.fgMuted }}>Customer</span>
                <span style={{ fontWeight: 600, color: theme.fg }}>{selectedOrder?.customer_name || 'Guest'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.borderLight}`, fontSize: 13 }}>
                <span style={{ color: theme.fgMuted }}>Driver</span>
                <span style={{ fontWeight: 600, color: theme.fg }}>{selectedDriver?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.borderLight}`, fontSize: 13 }}>
                <span style={{ color: theme.fgMuted }}>Vehicle</span>
                <span style={{ fontWeight: 600, color: theme.fg }}>{selectedDriver?.vehicle || '—'} · {selectedDriver?.plate || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span style={{ color: theme.fgMuted }}>Pickup</span>
                <span style={{ fontWeight: 600, color: theme.fg }}>{selectedOrder?.arrival_time?.substring(0, 5) || '--:--'}</span>
              </div>
            </div>
            <div className="dp-modal-footer">
              <button onClick={() => setModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: theme.radiusSm, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.fg, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => selectedOrder && selectedDriver && doAssign(selectedOrder.id, selectedDriver.id)}
                style={{ padding: '8px 16px', borderRadius: theme.radiusSm, border: 'none', background: theme.accent, color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                disabled={!selectedDriver}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      <div className="notif-stack">
        {notifications.map(n => {
          const typeColors: Record<string, string> = { assign: theme.accent, unassign: theme.warning, status: theme.info }
          return (
            <div key={n.id} className="notif-card">
              <div className="notif-title" style={{ color: typeColors[n.type] || theme.accent }}>{n.title}</div>
              <div className="notif-desc">{n.desc}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
