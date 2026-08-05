'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface Trip {
  id: number
  name: string
  slug: string
  description: string
  price_per_person_usd: number
  is_active: number
  sort_order: number
  created_at: string
  updated_at: string
}

export default function TripsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()

  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTrip, setEditTrip] = useState<Trip | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const fetchTrips = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/trips')
      if (res.ok) {
        const data = await res.json()
        setTrips(data.trips || [])
      }
    } catch (e) { console.error('Failed to fetch trips', e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const openCreate = () => {
    setEditTrip(null)
    setForm({ name: '', slug: '', description: '', price_per_person_usd: 0, is_active: true, sort_order: 0 })
    setModalOpen(true)
  }

  const openEdit = (trip: Trip) => {
    setEditTrip(trip)
    setForm({
      name: trip.name,
      slug: trip.slug,
      description: trip.description || '',
      price_per_person_usd: trip.price_per_person_usd,
      is_active: trip.is_active === 1,
      sort_order: trip.sort_order,
    })
    setModalOpen(true)
  }

  const save = async () => {
    try {
      const method = editTrip ? 'PUT' : 'POST'
      const body = editTrip ? { id: editTrip.id, ...form } : form
      const res = await adminFetch('/api/admin/trips', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editTrip ? t.admin.trips.editTrip + ' ✓' : t.admin.trips.addTrip + ' ✓')
        setModalOpen(false)
        fetchTrips()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save trip')
      }
    } catch { showToast('Error saving trip') }
  }

  const remove = async (id: number) => {
    if (!confirm(t.admin.trips.confirmDelete)) return
    const res = await adminFetch(`/api/admin/trips?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t.admin.trips.delete + ' ✓')
      fetchTrips()
    }
  }

  const toggleActive = async (trip: Trip) => {
    const res = await adminFetch('/api/admin/trips', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trip.id, is_active: trip.is_active === 1 ? 0 : 1 }),
    })
    if (res.ok) fetchTrips()
  }

  const moveTrip = async (tripId: number, direction: 'up' | 'down') => {
    const sorted = [...trips].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(t => t.id === tripId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const temp = sorted[idx].sort_order
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order }
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: temp }
    const orderedIds = sorted.map(t => t.id)
    try {
      const res = await adminFetch('/api/admin/trips/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })
      if (res.ok) fetchTrips()
    } catch { showToast('Error reordering') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">Loading trips...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="drivers-hero">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter text-fg">
            {t.admin.trips.title}
          </h1>
          <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
            {t.admin.trips.subtitle}
          </p>
        </div>
        <div className="drivers-toolbar flex items-center gap-2.5 flex-wrap">
          <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreate}>
            + {t.admin.trips.addTrip}
          </button>
        </div>
      </div>

      <div className="drivers-layout">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>{t.admin.trips.title}</span>
              <span className="count">{trips.length} listed</span>
            </div>
          </div>

          {trips.length === 0 ? (
            <p className="text-fg-muted text-center py-12" style={{ gridColumn: '1/-1' }}>
              {t.admin.trips.noTrips}. Click &ldquo;+ {t.admin.trips.addTrip}&rdquo; to create the first one.
            </p>
          ) : (
            <div className="driver-grid">
              {trips.map((trip) => (
                <div key={trip.id} className="driver-card">
                  <div className="driver-card-header">
                    <div>
                      <h3 className="text-[15px] font-semibold text-fg">{trip.name}</h3>
                      <p className="text-[12px] text-fg-muted mt-0.5">{trip.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(trip)}
                        className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                          trip.is_active === 1 ? 'bg-accent' : 'bg-[var(--border)]'
                        }`}
                        aria-label={trip.is_active === 1 ? 'Deactivate' : 'Activate'}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                          trip.is_active === 1 ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {trip.description && (
                    <p className="text-[13px] text-fg-muted mt-2 line-clamp-2">{trip.description}</p>
                  )}

                  <div className="driver-card-footer">
                    <span className="text-[13px] font-semibold text-accent">
                      ${trip.price_per_person_usd.toFixed(2)} / {t.admin.trips.pricePerPersonUsd.split('(')[0].trim()}
                    </span>
                    <span className="text-[11px] text-fg-muted">#{trip.sort_order}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3">
                    <button
                      onClick={() => moveTrip(trip.id, 'up')}
                      disabled={trip.sort_order <= 0}
                      className="p-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
                      aria-label="Move up"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button
                      onClick={() => moveTrip(trip.id, 'down')}
                      className="p-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
                      aria-label="Move down"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => openEdit(trip)}
                      className="px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-white border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      {t.admin.plans.editPlan}
                    </button>
                    <button
                      onClick={() => remove(trip.id)}
                      className="px-3 py-1.5 text-[12px] font-medium text-red-400 hover:text-red-300 border border-[rgba(239,68,68,0.3)] rounded-md hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                    >
                      {t.admin.plans.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalOpen(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 w-full max-w-md shadow-[0_24px_48px_rgba(0,0,0,0.4)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-white mb-4">
              {editTrip ? t.admin.trips.editTrip : t.admin.trips.addTrip}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.trips.tripName}</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.trips.slug}</label>
                <input
                  type="text"
                  value={form.slug || ''}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.trips.description}</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.trips.pricePerPersonUsd}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_per_person_usd || 0}
                    onChange={e => setForm({ ...form, price_per_person_usd: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.trips.sortOrder}</label>
                  <input
                    type="number"
                    value={form.sort_order || 0}
                    onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-[13px] text-fg-muted">{t.admin.trips.isActive}</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-[13px] font-medium text-fg-muted border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {t.admin.trips.cancel}
              </button>
              <button
                onClick={save}
                className="px-4 py-2 text-[13px] font-medium text-white bg-accent rounded-md hover:bg-[#059669] transition-colors"
              >
                {t.admin.trips.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}