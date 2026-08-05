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
}

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price_usd: number
  price_per_person_usd: number
  is_popular: number
  is_active: number
  sort_order: number
}

type Tab = 'packages' | 'trips' | 'settings'

export default function BookingPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('packages')

  // ── Packages state ──
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [planModal, setPlanModal] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState<Record<string, any>>({})

  // ── Trips state ──
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const [tripModal, setTripModal] = useState(false)
  const [editTrip, setEditTrip] = useState<Trip | null>(null)
  const [tripForm, setTripForm] = useState<Record<string, any>>({})

  // ── Settings state ──
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (e) { console.error('Failed to fetch plans', e) }
    setPlansLoading(false)
  }, [])

  const fetchTrips = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/trips')
      if (res.ok) {
        const data = await res.json()
        setTrips(data.trips || [])
      }
    } catch (e) { console.error('Failed to fetch trips', e) }
    setTripsLoading(false)
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
      }
    } catch (e) { console.error('Failed to fetch settings', e) }
    setSettingsLoading(false)
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchTrips()
    fetchSettings()
  }, [fetchPlans, fetchTrips, fetchSettings])

  // ── Plan CRUD ──
  const openCreatePlan = () => {
    setEditPlan(null)
    setPlanForm({ name: '', slug: '', description: '', price_usd: 0, price_per_person_usd: 0, is_popular: false, is_active: true, sort_order: 0 })
    setPlanModal(true)
  }

  const openEditPlan = (p: Plan) => {
    setEditPlan(p)
    setPlanForm({ name: p.name, slug: p.slug, description: p.description || '', price_usd: p.price_usd, price_per_person_usd: p.price_per_person_usd || 0, is_popular: p.is_popular === 1, is_active: p.is_active === 1, sort_order: p.sort_order })
    setPlanModal(true)
  }

  const savePlan = async () => {
    try {
      const method = editPlan ? 'PUT' : 'POST'
      const body = editPlan ? { id: editPlan.id, ...planForm } : planForm
      const res = await adminFetch('/api/admin/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editPlan ? 'Plan updated ✓' : 'Plan created ✓')
        setPlanModal(false)
        fetchPlans()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save plan')
      }
    } catch { showToast('Error saving plan') }
  }

  const deletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    const res = await adminFetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Plan deleted ✓')
      fetchPlans()
    }
  }

  // ── Trip CRUD ──
  const openCreateTrip = () => {
    setEditTrip(null)
    setTripForm({ name: '', slug: '', description: '', price_per_person_usd: 0, is_active: true, sort_order: 0 })
    setTripModal(true)
  }

  const openEditTrip = (trip: Trip) => {
    setEditTrip(trip)
    setTripForm({ name: trip.name, slug: trip.slug, description: trip.description || '', price_per_person_usd: trip.price_per_person_usd, is_active: trip.is_active === 1, sort_order: trip.sort_order })
    setTripModal(true)
  }

  const saveTrip = async () => {
    try {
      const method = editTrip ? 'PUT' : 'POST'
      const body = editTrip ? { id: editTrip.id, ...tripForm } : tripForm
      const res = await adminFetch('/api/admin/trips', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editTrip ? 'Trip updated ✓' : 'Trip created ✓')
        setTripModal(false)
        fetchTrips()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save trip')
      }
    } catch { showToast('Error saving trip') }
  }

  const deleteTrip = async (id: number) => {
    if (!confirm('Are you sure you want to delete this trip?')) return
    const res = await adminFetch(`/api/admin/trips?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Trip deleted ✓')
      fetchTrips()
    }
  }

  // ── Settings ──
  const updateSetting = async (key: string, value: string) => {
    setSettingsSaving(true)
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (res.ok) {
        setSettings({ ...settings, [key]: value })
        showToast('Setting saved ✓')
      } else {
        showToast('Failed to save setting')
      }
    } catch { showToast('Error saving setting') }
    setSettingsSaving(false)
  }

  const settingFields = [
    { key: 'advance_booking_days', label: t.admin.booking.advanceBookingDays, type: 'number', group: 'Booking Rules' },
    { key: 'default_currency', label: t.admin.booking.defaultCurrency, type: 'text', group: 'Booking Rules' },
    { key: 'brand_name', label: t.admin.booking.brandName, type: 'text', group: 'Branding' },
    { key: 'return_trip_charge', label: t.admin.booking.returnTripCharge, type: 'number', group: 'Pricing' },
    { key: 'service_fee_flat', label: t.admin.booking.serviceFee, type: 'number', group: 'Pricing' },
    { key: 'tax_rate_iva', label: t.admin.booking.taxRate, type: 'number', step: '0.01', group: 'Pricing' },
    { key: 'payment_polling_interval_ms', label: t.admin.booking.paymentPollInterval, type: 'number', group: 'Payment' },
    { key: 'payment_polling_max_attempts', label: t.admin.booking.paymentMaxAttempts, type: 'number', group: 'Payment' },
    { key: 'payment_intent_timeout_ms', label: t.admin.booking.paymentTimeout, type: 'number', group: 'Payment' },
    { key: 'trm_fallback_rate', label: t.admin.booking.trm, type: 'number', group: 'Exchange Rate' },
  ]

  const groupedFields = settingFields.reduce<Record<string, typeof settingFields>>((acc, field) => {
    if (!acc[field.group]) acc[field.group] = []
    acc[field.group].push(field)
    return acc
  }, {})

  const tabs: { key: Tab; label: string }[] = [
    { key: 'packages', label: t.admin.booking.packages },
    { key: 'trips', label: t.admin.booking.trips },
    { key: 'settings', label: t.admin.booking.settings },
  ]

  return (
    <div style={{ padding: 0 }}>
      <div className="drivers-hero">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter text-fg">
            {t.admin.booking.title}
          </h1>
          <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
            {t.admin.booking.subtitle}
          </p>
        </div>
      </div>

      <div className="border-b border-[var(--border)] mb-6">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'packages' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreatePlan}>
              + {t.admin.plans.addPlan}
            </button>
          </div>

          {plansLoading ? (
            <div className="text-fg-muted text-center py-12">Loading...</div>
          ) : plans.length === 0 ? (
            <p className="text-fg-muted text-center py-12">{t.admin.plans.noPlans}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{plan.name}</h3>
                      <p className="text-[12px] text-fg-muted">{plan.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${plan.is_active === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {plan.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                      {plan.is_popular === 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">Popular</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[13px] text-fg-muted mb-3 line-clamp-2">{plan.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-accent">${plan.price_usd}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditPlan(plan)} className="px-3 py-1.5 text-[12px] text-fg-muted hover:text-white border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors">
                        {t.admin.plans.editPlan}
                      </button>
                      <button onClick={() => deletePlan(plan.id)} className="px-3 py-1.5 text-[12px] text-red-400 hover:text-red-300 border border-[rgba(239,68,68,0.3)] rounded-md hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                        {t.admin.plans.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trips' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreateTrip}>
              + {t.admin.booking.addTrip}
            </button>
          </div>

          {tripsLoading ? (
            <div className="text-fg-muted text-center py-12">Loading...</div>
          ) : trips.length === 0 ? (
            <p className="text-fg-muted text-center py-12">{t.admin.booking.noTrips}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map(trip => (
                <div key={trip.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{trip.name}</h3>
                      <p className="text-[12px] text-fg-muted">{trip.slug}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${trip.is_active === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trip.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {trip.description && (
                    <p className="text-[13px] text-fg-muted mb-3 line-clamp-2">{trip.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-accent">${trip.price_per_person_usd.toFixed(2)} <span className="text-[11px] font-normal text-fg-muted">/ person</span></span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditTrip(trip)} className="px-3 py-1.5 text-[12px] text-fg-muted hover:text-white border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors">
                        {t.admin.plans.editPlan}
                      </button>
                      <button onClick={() => deleteTrip(trip.id)} className="px-3 py-1.5 text-[12px] text-red-400 hover:text-red-300 border border-[rgba(239,68,68,0.3)] rounded-md hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                        {t.admin.plans.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          {settingsLoading ? (
            <div className="text-fg-muted text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFields).map(([group, fields]) => (
                <div key={group} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
                  <h3 className="text-[14px] font-semibold text-white mb-4">{group}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[12px] font-medium text-fg-muted mb-1.5">
                          {field.label}
                          {field.key === 'trm_fallback_rate' && settings['trm_fallback_rate'] ? (
                            <span className="ml-2 text-[11px] text-accent">TRM: {Number(settings['trm_fallback_rate']).toLocaleString('es-CO')} COP/USD</span>
                          ) : null}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type={field.type}
                            step={field.step || '1'}
                            min="0"
                            value={settings[field.key] ?? ''}
                            onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none"
                          />
                          <button
                            onClick={() => updateSetting(field.key, settings[field.key] || '')}
                            disabled={settingsSaving}
                            className="px-3 py-2 text-[12px] font-medium text-white bg-accent rounded-md hover:bg-[#059669] transition-colors shrink-0"
                          >
                            {t.admin.booking.save}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPlanModal(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 w-full max-w-md shadow-[0_24px_48px_rgba(0,0,0,0.4)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-white mb-4">
              {editPlan ? t.admin.plans.editPlan : t.admin.plans.addPlan}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.plans.planName}</label>
                <input type="text" value={planForm.name || ''} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.plans.slug}</label>
                <input type="text" value={planForm.slug || ''} onChange={e => setPlanForm({ ...planForm, slug: e.target.value })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.plans.description}</label>
                <textarea value={planForm.description || ''} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.plans.priceUsd}</label>
                  <input type="number" step="0.01" value={planForm.price_usd || 0} onChange={e => setPlanForm({ ...planForm, price_usd: Number(e.target.value) })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.plans.pricePerPersonUsd}</label>
                  <input type="number" step="0.01" value={planForm.price_per_person_usd || 0} onChange={e => setPlanForm({ ...planForm, price_per_person_usd: Number(e.target.value) })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={planForm.is_popular} onChange={e => setPlanForm({ ...planForm, is_popular: e.target.checked })} className="w-4 h-4 rounded border-[var(--border)] text-accent focus:ring-accent/20 focus:ring-2" />
                <span className="text-[13px] text-fg-muted">{t.admin.plans.isPopular}</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={planForm.is_active !== false} onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })} className="w-4 h-4 rounded border-[var(--border)] text-accent focus:ring-accent/20 focus:ring-2" />
                <span className="text-[13px] text-fg-muted">{t.admin.plans.isActive}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setPlanModal(false)} className="px-4 py-2 text-[13px] font-medium text-fg-muted border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors">{t.admin.plans.cancel}</button>
              <button onClick={savePlan} className="px-4 py-2 text-[13px] font-medium text-white bg-accent rounded-md hover:bg-[#059669] transition-colors">{t.admin.plans.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Modal */}
      {tripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setTripModal(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 w-full max-w-md shadow-[0_24px_48px_rgba(0,0,0,0.4)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-white mb-4">
              {editTrip ? t.admin.booking.editTrip : t.admin.booking.addTrip}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.booking.tripName}</label>
                <input type="text" value={tripForm.name || ''} onChange={e => setTripForm({ ...tripForm, name: e.target.value })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.booking.slug}</label>
                <input type="text" value={tripForm.slug || ''} onChange={e => setTripForm({ ...tripForm, slug: e.target.value })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.booking.description}</label>
                <textarea value={tripForm.description || ''} onChange={e => setTripForm({ ...tripForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.booking.pricePerPersonUsd}</label>
                  <input type="number" step="0.01" value={tripForm.price_per_person_usd || 0} onChange={e => setTripForm({ ...tripForm, price_per_person_usd: Number(e.target.value) })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-fg-muted mb-1.5">{t.admin.booking.sortOrder}</label>
                  <input type="number" value={tripForm.sort_order || 0} onChange={e => setTripForm({ ...tripForm, sort_order: Number(e.target.value) })} className="w-full px-3 py-2 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={tripForm.is_active !== false} onChange={e => setTripForm({ ...tripForm, is_active: e.target.checked })} className="w-4 h-4 rounded border-[var(--border)] text-accent focus:ring-accent/20 focus:ring-2" />
                <span className="text-[13px] text-fg-muted">{t.admin.booking.isActive}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setTripModal(false)} className="px-4 py-2 text-[13px] font-medium text-fg-muted border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors">{t.admin.booking.cancel}</button>
              <button onClick={saveTrip} className="px-4 py-2 text-[13px] font-medium text-white bg-accent rounded-md hover:bg-[#059669] transition-colors">{t.admin.booking.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}