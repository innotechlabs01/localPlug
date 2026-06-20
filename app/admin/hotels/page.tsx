'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface Hotel {
  id: number; name: string; slug: string; description: string; address: string
  lat: number | null; lng: number | null
  phone: string; email: string; website: string
  photos: string; stars: number; status: string
  commission_rate: number; room_count: number; available_rooms: number
}

interface Room {
  id: number; hotel_id: number; hotel_name: string; name: string
  description: string; capacity: number; price_per_night: number
  display_price: number; amenities: string; photos: string; status: string
}

interface Promotion {
  id: number; hotel_id: number; type: string; code: string | null
  discount_amount: number; is_active: number; usage_limit: number | null
  usage_count: number; starts_at: string | null; ends_at: string | null
}

const starColors: Record<number, string> = {
  1: '#9ca0b0', 2: '#646880', 3: '#f59e0b', 4: '#f59e0b', 5: '#10b981',
}

export default function HotelsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()

  const [hotels, setHotels] = useState<Hotel[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<'rooms' | 'promos' | 'bookings'>('rooms')
  const [statsData, setStatsData] = useState<any>(null)
  const [isHotelManager, setIsHotelManager] = useState(false)
  const [managerData, setManagerData] = useState<any>(null)
  const [hotelManagerUsers, setHotelManagerUsers] = useState<any[]>([])
  const [assigningManager, setAssigningManager] = useState(false)

  // Modal states
  const [hotelModal, setHotelModal] = useState(false)
  const [roomModal, setRoomModal] = useState(false)
  const [promoModal, setPromoModal] = useState(false)
  const [editHotel, setEditHotel] = useState<Hotel | null>(null)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [editPromo, setEditPromo] = useState<Promotion | null>(null)
  const [hotelForm, setHotelForm] = useState<Record<string, any>>({})
  const [roomForm, setRoomForm] = useState<Record<string, any>>({})
  const [promoForm, setPromoForm] = useState<Record<string, any>>({})

  const fetchStats = useCallback(async (hotelId: number) => {
    try {
      const res = await adminFetch(`/api/admin/hotels/stats?hotel_id=${hotelId}`)
      if (res.ok) setStatsData(await res.json())
    } catch { /* stats not critical */ }
  }, [])

  const fetchManager = useCallback(async (hotelId: number) => {
    try {
      const res = await adminFetch(`/api/admin/users/hotel-assign?hotel_id=${hotelId}`)
      if (res.ok) {
        const data = await res.json()
        setManagerData(data.manager || null)
      }
    } catch { /* non-critical */ }
  }, [])

  const fetchHotelManagerUsers = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/employees')
      if (res.ok) {
        const data = await res.json()
        setHotelManagerUsers(
          (data.employees || []).filter((u: any) =>
            u.role_name === 'hotel_manager' || u.role_name === 'admin'
          )
        )
      }
    } catch { /* non-critical */ }
  }, [])

  const fetchHotels = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/hotels')
      if (res.ok) {
        const data = await res.json()
        const h = data.hotels || []
        setHotels(h)
        if (h.length === 1 && !selectedId) {
          setIsHotelManager(true)
          setSelectedId(h[0].id)
          fetchStats(h[0].id)
          setTab('rooms')
        }
      }
    } catch (e) { console.error('Failed to fetch hotels', e) }
    setLoading(false)
  }, [])

  const fetchRooms = useCallback(async (hotelId: number) => {
    try {
      const res = await adminFetch(`/api/admin/rooms?hotel_id=${hotelId}`)
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch (e) { console.error('Failed to fetch rooms', e) }
  }, [])

  const fetchPromotions = useCallback(async (hotelId: number) => {
    try {
      const res = await adminFetch(`/api/admin/promotions?hotel_id=${hotelId}`)
      if (res.ok) {
        const data = await res.json()
        setPromotions(data.promotions || [])
      }
    } catch (e) { console.error('Failed to fetch promotions', e) }
  }, [])

  useEffect(() => { fetchHotels(); fetchHotelManagerUsers() }, [fetchHotels, fetchHotelManagerUsers])

  useEffect(() => {
    if (selectedId) {
      fetchRooms(selectedId)
      fetchPromotions(selectedId)
      if (!isHotelManager) {
        fetchStats(selectedId)
        fetchManager(selectedId)
      }
    }
  }, [selectedId, fetchRooms, fetchPromotions, fetchStats, fetchManager, isHotelManager])

  const selected = hotels.find(h => h.id === selectedId)

  const stats = {
    total: hotels.length,
    active: hotels.filter(h => h.status === 'active').length,
    totalRooms: hotels.reduce((s, h) => s + (h.room_count || 0), 0),
    availableRooms: hotels.reduce((s, h) => s + (h.available_rooms || 0), 0),
    avgCommission: hotels.length
      ? Math.round(hotels.reduce((s, h) => s + (Number(h.commission_rate) || 0) * 100, 0) / hotels.length)
      : 10,
  }

  const renderStars = (stars: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < stars ? starColors[stars] || '#f59e0b' : '#2a2d3a' }}>★</span>
    ))
  }

  // ───── Hotel CRUD ─────
  const openCreateHotel = () => {
    setEditHotel(null)
    setHotelForm({ name: '', description: '', address: '', phone: '', email: '', website: '', stars: 3, status: 'active', commission_rate: 0.10 })
    setHotelModal(true)
  }

  const openEditHotel = (h: Hotel) => {
    setEditHotel(h)
    setHotelForm({
      name: h.name, description: h.description || '', address: h.address || '',
      phone: h.phone || '', email: h.email || '', website: h.website || '',
      stars: h.stars, status: h.status, commission_rate: h.commission_rate,
    })
    setHotelModal(true)
  }

  const saveHotel = async () => {
    try {
      const method = editHotel ? 'PUT' : 'POST'
      const body = editHotel ? { id: editHotel.id, ...hotelForm } : hotelForm
      const res = await adminFetch('/api/admin/hotels', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editHotel ? 'Hotel updated' : 'Hotel created')
        setHotelModal(false)
        fetchHotels()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save hotel')
      }
    } catch { showToast('Error saving hotel') }
  }

  const deleteHotel = async (id: number) => {
    if (!confirm('Delete this hotel and all its rooms?')) return
    const res = await adminFetch(`/api/admin/hotels?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Hotel deleted')
      if (selectedId === id) setSelectedId(null)
      fetchHotels()
    }
  }

  // ───── Room CRUD ─────
  const openCreateRoom = () => {
    if (!selectedId) return
    setEditRoom(null)
    setRoomForm({
      hotel_id: selectedId, name: '', description: '', capacity: 1,
      price_per_night: '', amenities: '', status: 'available',
    })
    setRoomModal(true)
  }

  const openEditRoom = (r: Room) => {
    setEditRoom(r)
    setRoomForm({
      name: r.name, description: r.description || '', capacity: r.capacity,
      price_per_night: r.price_per_night, amenities: typeof r.amenities === 'string' ? r.amenities : JSON.stringify(r.amenities),
      status: r.status,
    })
    setRoomModal(true)
  }

  const saveRoom = async () => {
    try {
      const method = editRoom ? 'PUT' : 'POST'
      const body = editRoom
        ? { id: editRoom.id, ...roomForm }
        : { hotel_id: selectedId, ...roomForm }
      const res = await adminFetch('/api/admin/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editRoom ? 'Room updated' : 'Room created')
        setRoomModal(false)
        fetchRooms(selectedId!)
        fetchHotels()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save room')
      }
    } catch { showToast('Error saving room') }
  }

  const deleteRoom = async (id: number) => {
    if (!confirm('Delete this room?')) return
    await adminFetch(`/api/admin/rooms?id=${id}`, { method: 'DELETE' })
    showToast('Room deleted')
    fetchRooms(selectedId!)
    fetchHotels()
  }

  // ───── Promotion CRUD ─────
  const openCreatePromo = () => {
    if (!selectedId) return
    setEditPromo(null)
    setPromoForm({
      hotel_id: selectedId, type: 'discount', code: '', discount_amount: '',
      is_active: true, usage_limit: '', starts_at: '', ends_at: '',
    })
    setPromoModal(true)
  }

  const openEditPromo = (p: Promotion) => {
    setEditPromo(p)
    setPromoForm({
      type: p.type, code: p.code || '', discount_amount: p.discount_amount,
      is_active: p.is_active === 1, usage_limit: p.usage_limit || '',
      starts_at: p.starts_at || '', ends_at: p.ends_at || '',
    })
    setPromoModal(true)
  }

  const savePromo = async () => {
    try {
      const method = editPromo ? 'PUT' : 'POST'
      const body = editPromo
        ? { id: editPromo.id, ...promoForm }
        : { hotel_id: selectedId, ...promoForm }
      const res = await adminFetch('/api/admin/promotions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editPromo ? 'Promotion updated' : 'Promotion created')
        setPromoModal(false)
        fetchPromotions(selectedId!)
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save promotion')
      }
    } catch { showToast('Error saving promotion') }
  }

  const deletePromo = async (id: number) => {
    if (!confirm('Delete this promotion?')) return
    await adminFetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' })
    showToast('Promotion deleted')
    fetchPromotions(selectedId!)
  }

  const assignManager = async (userId: number, hotelId: number | null) => {
    setAssigningManager(true)
    try {
      const res = await adminFetch('/api/admin/users/hotel-assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, hotel_id: hotelId }),
      })
      if (res.ok) {
        showToast(hotelId ? 'Manager assigned' : 'Manager unassigned')
        fetchManager(selectedId!)
        fetchHotelManagerUsers()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to assign manager')
      }
    } catch { showToast('Error assigning manager') }
    setAssigningManager(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">Loading hotels...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      {/* ── HEADER ── */}
      <div className="drivers-hero">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter text-fg">
            {isHotelManager && selected ? selected.name : t.admin.nav.hotels}
          </h1>
          <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
            {isHotelManager
              ? `Manage your rooms, pricing, promotions, and track bookings for ${selected?.name || 'your hotel'}.`
              : 'Manage hotel partners, room inventory, pricing, promotions, and commission rates for the booking platform.'}
          </p>
        </div>
        <div className="drivers-toolbar flex items-center gap-2.5 flex-wrap">
          {isHotelManager ? (
            <>
              <button className="btn btn-sm btn-secondary" onClick={() => { if (selected) openEditHotel(selected) }}>
                Edit Hotel Info
              </button>
              <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreateRoom}>
                + Add Room
              </button>
            </>
          ) : (
            <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreateHotel}>
              + Add Hotel
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      {isHotelManager && statsData ? (
        <div className="drivers-kpis grid-6">
          {[
            ['Total Rooms', String(statsData.rooms?.total_rooms || 0), 'All rooms', true],
            ['Available', String(statsData.rooms?.available_rooms || 0), 'Ready to book', true],
            ['Bookings', String(statsData.bookings?.total_bookings || 0), 'All time', true],
            ['Today Staying', String(statsData.today?.currently_staying || 0), 'Guests in hotel', true],
            ['Hotel Revenue', `$${Number(statsData.bookings?.hotel_revenue || 0).toFixed(0)}`, 'Your earnings', true],
            ['Platform Revenue', `$${Number(statsData.bookings?.platform_revenue || 0).toFixed(0)}`, `${Math.round((selected?.commission_rate || 0) * 100)}% commission`, false],
          ].map(([label, value, sub, positive], idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
              <div className={`stat-change ${positive ? 'up' : 'down'}`}>{sub}</div>
            </div>
          ))}
        </div>
      ) : !isHotelManager ? (
        <div className="drivers-kpis grid-6">
          {[
            ['Total Hotels', String(stats.total), '+ this month', true],
            ['Active', String(stats.active), 'Accepting bookings', true],
            ['Total Rooms', String(stats.totalRooms), 'All properties', true],
            ['Available', String(stats.availableRooms), 'Ready to book', true],
            ['Avg Commission', `${stats.avgCommission}%`, 'Platform rate', false],
            ['Bookings', '—', 'Room bookings', false],
          ].map(([label, value, sub, positive], idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
              <div className={`stat-change ${positive ? 'up' : 'down'}`}>{sub}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── MAIN LAYOUT ── */}
      <div className="drivers-layout">
        {!isHotelManager && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>Hotel Partners</span>
              <span className="count">{hotels.length} listed</span>
            </div>
          </div>

          <div className="driver-grid">
            {hotels.length === 0 ? (
              <p className="text-fg-muted text-center py-12" style={{ gridColumn: '1/-1' }}>
                No hotels yet. Click &ldquo;+ Add Hotel&rdquo; to create the first one.
              </p>
            ) : hotels.map(h => (
              <div
                key={h.id}
                className={`driver-card ${selectedId === h.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(h.id); setTab('rooms') }}
              >
                <div className="driver-head">
                  <div className="driver-person">
                    <div className="driver-avatar" style={{
                      background: 'linear-gradient(135deg, var(--accent), #059669)',
                      fontSize: 18, fontWeight: 700,
                    }}>
                      {h.name.charAt(0)}
                    </div>
                    <div>
                      <div className="driver-name">
                        {h.name}
                        <span className="ml-1">{renderStars(h.stars)}</span>
                      </div>
                      <div className="driver-meta">
                        {h.address?.slice(0, 40) || 'No address'} · {h.phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                  <span className={h.status === 'active' ? 'badge badge-accent' : 'badge'}>
                    {h.status}
                  </span>
                </div>

                <div className="driver-stats">
                  <div className="driver-stat">
                    <strong>{h.room_count || 0}</strong>
                    <span>Total Rooms</span>
                  </div>
                  <div className="driver-stat">
                    <strong>{h.available_rooms || 0}</strong>
                    <span>Available</span>
                  </div>
                  <div className="driver-stat">
                    <strong>{Number(h.commission_rate) * 100}%</strong>
                    <span>Commission</span>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap mt-2">
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); openEditHotel(h) }}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); deleteHotel(h.id) }} style={{ color: '#ef4444' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── RIGHT: DETAIL PANEL ── */}
        <aside className="side-stack">
          {/* Hotel Info */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title font-medium text-fg">Hotel Details</span>
            </div>
            <div className="panel-body p-4">
              {!selected ? (
                <p className="text-fg-muted text-center py-8">Select a hotel to manage</p>
              ) : (
                <div>
                  <div className="profile-top">
                    <div className="profile-photo" style={{ background: 'linear-gradient(135deg, var(--accent), #059669)', fontSize: 28, fontWeight: 700 }}>
                      {selected.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-fg">{selected.name}</h2>
                      <div className="sub">{selected.address}</div>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        <span className={selected.status === 'active' ? 'badge badge-accent' : 'badge'}>{selected.status}</span>
                        <span className="badge badge-info">{Number(selected.commission_rate) * 100}% commission</span>
                      </div>
                    </div>
                  </div>
                  <div className="info-grid mt-4">
                    {[
                      ['Email', selected.email || '—'],
                      ['Phone', selected.phone || '—'],
                      ['Website', selected.website || '—'],
                      ['Stars', `${selected.stars} ⭐`],
                      ['Slug', selected.slug],
                      ['Rooms', `${selected.available_rooms || 0} available / ${selected.room_count || 0} total`],
                    ].map(([label, value]) => (
                      <div key={label} className="info-item">
                        <label>{label}</label>
                        <div>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Commission preview */}
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="text-[12px] font-semibold text-accent mb-1">Commission Preview</div>
                    <div className="text-[11px] text-fg-muted">
                      If a room costs <strong>$100</strong> base price, the customer sees{' '}
                      <strong>${Math.round(100 * (1 + Number(selected.commission_rate))) * 100 / 100}</strong>.
                      Platform earns <strong>${Math.round(100 * Number(selected.commission_rate)) * 100 / 100}</strong> per night.
                    </div>
                  </div>

                  {/* Manager Assignment (admin only) */}
                  {!isHotelManager && (
                    <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="text-[12px] font-semibold text-fg mb-2">Hotel Manager</div>
                      {managerData ? (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[13px] font-medium text-fg">{managerData.name}</div>
                            <div className="text-[11px] text-fg-muted">{managerData.email} · {managerData.role_name}</div>
                          </div>
                          <button
                            className="btn btn-sm btn-secondary"
                            style={{ color: '#ef4444', fontSize: 11 }}
                            onClick={() => assignManager(managerData.id, null)}
                            disabled={assigningManager}
                          >
                            Unassign
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[11px] text-fg-muted mb-2">No manager assigned. Assign one from users with hotel_manager role:</p>
                          <select
                            className="w-full p-2 rounded border text-[13px] mb-2"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--fg)', borderColor: 'var(--border)' }}
                            defaultValue=""
                            onChange={e => {
                              const uid = parseInt(e.target.value)
                              if (uid) assignManager(uid, selected.id)
                            }}
                            disabled={assigningManager}
                          >
                            <option value="" disabled>Select a user...</option>
                            {hotelManagerUsers
                              .filter((u: any) => !u.hotel_id || u.hotel_id === selected.id)
                              .map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.email}) — {u.role_name}{u.hotel_id ? ' (already assigned)' : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {selected && (
            <div className="panel">
              <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([
                    ['rooms', 'Rooms'],
                    ['promos', 'Promotions'],
                    ['bookings', 'Bookings'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      style={{
                        padding: '8px 16px', borderRadius: '6px 6px 0 0',
                        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: tab === key ? 'var(--surface)' : 'transparent',
                        color: tab === key ? 'var(--fg)' : 'var(--fg-muted)',
                        borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-sm btn-secondary" onClick={tab === 'rooms' ? openCreateRoom : openCreatePromo}>
                  + Add {tab === 'rooms' ? 'Room' : 'Promo'}
                </button>
              </div>

              <div className="panel-body p-4">
                {/* Rooms tab */}
                {tab === 'rooms' && (
                  rooms.length === 0 ? (
                    <p className="text-fg-muted text-center py-6">No rooms yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {rooms.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div>
                            <div className="font-medium text-fg text-[14px]">{r.name}</div>
                            <div className="text-fg-muted text-[12px]">
                              Base: ${Number(r.price_per_night).toFixed(2)} → Customer sees: ${Number(r.display_price).toFixed(2)}
                              {selected && ` (${Number(selected.commission_rate) * 100}% commission)`}
                              · Capacity: {r.capacity} · {r.status}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditRoom(r)}>Edit</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => deleteRoom(r.id)} style={{ color: '#ef4444' }}>Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Promotions tab */}
                {tab === 'promos' && (
                  promotions.length === 0 ? (
                    <p className="text-fg-muted text-center py-6">No promotions yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {promotions.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div>
                            <div className="font-medium text-fg text-[14px]">
                              {p.type === 'promo_code' ? `🎫 ${p.code}` : '💰 Discount'} — ${p.discount_amount} off
                            </div>
                            <div className="text-fg-muted text-[12px]">
                              {p.is_active ? 'Active' : 'Inactive'}
                              · Used {p.usage_count}/{p.usage_limit || '∞'} times
                              {p.ends_at && ` · Until ${p.ends_at}`}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditPromo(p)}>Edit</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => deletePromo(p.id)} style={{ color: '#ef4444' }}>Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Bookings tab */}
                {tab === 'bookings' && (
                  !statsData?.recentBookings || statsData.recentBookings.length === 0 ? (
                    <p className="text-fg-muted text-center py-6">No bookings yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {statsData.recentBookings.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div>
                            <div className="font-medium text-fg text-[14px]">
                              {b.guest_name || b.customer_name || 'Guest'} — ${Number(b.total_amount).toFixed(2)}
                              {b.discount_applied > 0 && <span className="text-accent ml-1">(-${Number(b.discount_applied).toFixed(2)})</span>}
                            </div>
                            <div className="text-fg-muted text-[12px]">
                              {b.nights} night{b.nights !== 1 ? 's' : ''} · ${Number(b.price_per_night).toFixed(2)}/night
                              {b.check_in && ` · Check-in: ${b.check_in}`}
                            </div>
                            <div className="text-fg-muted text-[11px]">{b.customer_email || b.guest_email || ''}</div>
                          </div>
                          <span className={`badge ${b.status === 'confirmed' ? 'badge-accent' : b.status === 'checked_in' ? 'badge-info' : b.status === 'checked_out' ? 'badge' : 'badge-warning'}`}>
                            {b.status?.replace('_', ' ') || 'confirmed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── HOTEL MODAL ── */}
      {hotelModal && (
        <Modal onClose={() => setHotelModal(false)} title={editHotel ? 'Edit Hotel' : 'New Hotel'}>
          <ModalField label="Hotel Name">
            <input value={hotelForm.name || ''} onChange={e => setHotelForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Hotel Estelar" />
          </ModalField>
          <ModalField label="Description">
            <textarea rows={3} value={hotelForm.description || ''} onChange={e => setHotelForm(p => ({ ...p, description: e.target.value }))} />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Address">
              <input value={hotelForm.address || ''} onChange={e => setHotelForm(p => ({ ...p, address: e.target.value }))} />
            </ModalField>
            <ModalField label="Phone">
              <input value={hotelForm.phone || ''} onChange={e => setHotelForm(p => ({ ...p, phone: e.target.value }))} />
            </ModalField>
            <ModalField label="Email">
              <input value={hotelForm.email || ''} onChange={e => setHotelForm(p => ({ ...p, email: e.target.value }))} />
            </ModalField>
            <ModalField label="Website">
              <input value={hotelForm.website || ''} onChange={e => setHotelForm(p => ({ ...p, website: e.target.value }))} />
            </ModalField>
            <ModalField label="Stars (1-5)">
              <select value={hotelForm.stars || 3} onChange={e => setHotelForm(p => ({ ...p, stars: parseInt(e.target.value) }))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </ModalField>
            <ModalField label="Commission Rate">
              <div className="flex items-center gap-2">
                <input type="number" step="0.01" min="0" max="1" value={hotelForm.commission_rate || 0.10}
                  onChange={e => setHotelForm(p => ({ ...p, commission_rate: parseFloat(e.target.value) || 0 }))} />
                <span className="text-fg-muted text-[12px]">{(Number(hotelForm.commission_rate) * 100).toFixed(0)}%</span>
              </div>
            </ModalField>
            <ModalField label="Status">
              <select value={hotelForm.status || 'active'} onChange={e => setHotelForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </ModalField>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setHotelModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveHotel}>{editHotel ? 'Update' : 'Create'}</button>
          </div>
        </Modal>
      )}

      {/* ── ROOM MODAL ── */}
      {roomModal && (
        <Modal onClose={() => setRoomModal(false)} title={editRoom ? 'Edit Room' : 'New Room'}>
          <ModalField label="Room Name">
            <input value={roomForm.name || ''} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Suite Deluxe" />
          </ModalField>
          <ModalField label="Description">
            <textarea rows={2} value={roomForm.description || ''} onChange={e => setRoomForm(p => ({ ...p, description: e.target.value }))} />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Base Price / Night ($)">
              <input type="number" step="0.01" min="0" value={roomForm.price_per_night || ''}
                onChange={e => setRoomForm(p => ({ ...p, price_per_night: e.target.value }))} />

            </ModalField>
            <ModalField label="Capacity">
              <input type="number" min="1" value={roomForm.capacity || 1}
                onChange={e => setRoomForm(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} />
            </ModalField>
            <ModalField label="Amenities (comma-separated)">
              <input value={roomForm.amenities || ''} onChange={e => setRoomForm(p => ({ ...p, amenities: e.target.value }))}
                placeholder="WiFi, Pool, AC, Breakfast" />
            </ModalField>
            <ModalField label="Status">
              <select value={roomForm.status || 'available'} onChange={e => setRoomForm(p => ({ ...p, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </ModalField>
          </div>
          {selected && roomForm.price_per_night && (
            <div className="mt-3 p-2 rounded text-[12px]" style={{ background: 'var(--surface)' }}>
              <span className="text-fg-muted">Customer sees: </span>
              <strong className="text-accent">
                ${(Number(roomForm.price_per_night) * (1 + Number(selected.commission_rate))).toFixed(2)}
              </strong>
              <span className="text-fg-muted ml-1">(base + {Math.round(Number(selected.commission_rate) * 100)}% commission)</span>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setRoomModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveRoom}>{editRoom ? 'Update' : 'Create'}</button>
          </div>
        </Modal>
      )}

      {/* ── PROMO MODAL ── */}
      {promoModal && (
        <Modal onClose={() => setPromoModal(false)} title={editPromo ? 'Edit Promotion' : 'New Promotion'}>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Type">
              <select value={promoForm.type || 'discount'} onChange={e => setPromoForm(p => ({ ...p, type: e.target.value, code: e.target.value === 'discount' ? '' : p.code }))}>
                <option value="discount">Fixed Discount</option>
                <option value="promo_code">Promo Code</option>
              </select>
            </ModalField>
            <ModalField label="Discount Amount ($)">
              <input type="number" step="0.01" min="0" value={promoForm.discount_amount || ''}
                onChange={e => setPromoForm(p => ({ ...p, discount_amount: e.target.value }))} />
            </ModalField>
          </div>
          {promoForm.type === 'promo_code' && (
            <ModalField label="Promo Code">
              <input value={promoForm.code || ''} onChange={e => setPromoForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER20" />
            </ModalField>
          )}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <ModalField label="Usage Limit (empty = unlimited)">
              <input type="number" min="0" value={promoForm.usage_limit || ''}
                onChange={e => setPromoForm(p => ({ ...p, usage_limit: e.target.value || null }))} />
            </ModalField>
            <ModalField label="Active">
              <select value={promoForm.is_active ? '1' : '0'} onChange={e => setPromoForm(p => ({ ...p, is_active: e.target.value === '1' }))}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </ModalField>
            <ModalField label="Starts At">
              <input type="date" value={promoForm.starts_at || ''} onChange={e => setPromoForm(p => ({ ...p, starts_at: e.target.value }))} />
            </ModalField>
            <ModalField label="Ends At">
              <input type="date" value={promoForm.ends_at || ''} onChange={e => setPromoForm(p => ({ ...p, ends_at: e.target.value }))} />
            </ModalField>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setPromoModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={savePromo}>{editPromo ? 'Update' : 'Create'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Reusable modal shell ──
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '80px 24px', zIndex: 500,
    }} onClick={onClose}>
      <div style={{
        width: 'min(600px, 100%)', maxHeight: '80vh', overflow: 'auto',
        borderRadius: 16, background: 'var(--bg)',
        border: '1px solid var(--border)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{title}</h2>
          <button style={{ color: 'var(--fg-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }} onClick={onClose}>&times;</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}
