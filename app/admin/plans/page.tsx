'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface PlanFeature {
  id: number; plan_id: number; text: string; sort_order: number
}

interface PlanTour {
  id: number; plan_id: number; name: string; description: string
  price_per_person_usd: number; is_active: number; sort_order: number
}

interface Plan {
  id: number; name: string; slug: string; description: string
  price_usd: number; is_popular: number; is_active: number
  sort_order: number; created_at: string; updated_at: string
  features: PlanFeature[]; tours: PlanTour[]
}

export default function PlansPage() {
  const { t } = useI18n()
  const { showToast } = useToast()

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<'features' | 'tours'>('features')

  // Plan modal
  const [planModal, setPlanModal] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState<Record<string, any>>({})

  // Feature modal
  const [featureModal, setFeatureModal] = useState(false)
  const [editFeature, setEditFeature] = useState<PlanFeature | null>(null)
  const [featureForm, setFeatureForm] = useState<Record<string, any>>({})

  // Tour modal
  const [tourModal, setTourModal] = useState(false)
  const [editTour, setEditTour] = useState<PlanTour | null>(null)
  const [tourForm, setTourForm] = useState<Record<string, any>>({})

  const fetchPlans = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (e) { console.error('Failed to fetch plans', e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const selected = plans.find(p => p.id === selectedId)

  const stats = {
    total: plans.length,
    active: plans.filter(p => p.is_active === 1).length,
    popular: plans.filter(p => p.is_popular === 1).length,
    totalFeatures: plans.reduce((s, p) => s + (p.features?.length || 0), 0),
    totalTours: plans.reduce((s, p) => s + (p.tours?.length || 0), 0),
    avgPrice: plans.length
      ? Math.round(plans.reduce((s, p) => s + Number(p.price_usd || 0), 0) / plans.length)
      : 0,
  }

  // ───── Plan CRUD ─────
  const openCreatePlan = () => {
    setEditPlan(null)
    setPlanForm({
      name: '', description: '', price_usd: 0,
      is_popular: false, is_active: true, sort_order: 0,
    })
    setPlanModal(true)
  }

  const openEditPlan = (p: Plan) => {
    setEditPlan(p)
    setPlanForm({
      name: p.name, description: p.description || '',
      price_usd: p.price_usd, is_popular: p.is_popular === 1,
      is_active: p.is_active === 1, sort_order: p.sort_order,
    })
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
        showToast(editPlan ? t.admin.plans.editPlan + ' ✓' : t.admin.plans.addPlan + ' ✓')
        setPlanModal(false)
        fetchPlans()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save plan')
      }
    } catch { showToast('Error saving plan') }
  }

  const deletePlan = async (id: number) => {
    if (!confirm(t.admin.plans.confirmDelete)) return
    const res = await adminFetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t.admin.plans.delete + ' ✓')
      if (selectedId === id) setSelectedId(null)
      fetchPlans()
    }
  }

  // ───── Reorder ─────
  const movePlan = async (planId: number, direction: 'up' | 'down') => {
    const sorted = [...plans].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(p => p.id === planId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const temp = sorted[idx].sort_order
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order }
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: temp }
    const orderedIds = sorted.map(p => p.id)
    try {
      const res = await adminFetch('/api/admin/plans/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })
      if (res.ok) fetchPlans()
    } catch { showToast('Error reordering') }
  }

  // ───── Feature CRUD ─────
  const openCreateFeature = () => {
    if (!selectedId) return
    setEditFeature(null)
    setFeatureForm({ text: '' })
    setFeatureModal(true)
  }

  const openEditFeature = (f: PlanFeature) => {
    setEditFeature(f)
    setFeatureForm({ text: f.text })
    setFeatureModal(true)
  }

  const saveFeature = async () => {
    if (!selectedId) return
    try {
      const method = editFeature ? 'PUT' : 'POST'
      const body = editFeature
        ? { id: editFeature.id, text: featureForm.text }
        : { plan_id: selectedId, text: featureForm.text, sort_order: (selected?.features?.length || 0) + 1 }
      const res = await adminFetch('/api/admin/plans/features', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editFeature ? 'Feature updated' : 'Feature added')
        setFeatureModal(false)
        fetchPlans()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save feature')
      }
    } catch { showToast('Error saving feature') }
  }

  const deleteFeature = async (id: number) => {
    const res = await adminFetch(`/api/admin/plans/features?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Feature deleted')
      fetchPlans()
    }
  }

  // ───── Tour CRUD ─────
  const openCreateTour = () => {
    if (!selectedId) return
    setEditTour(null)
    setTourForm({ name: '', description: '', price_per_person_usd: 0, is_active: true })
    setTourModal(true)
  }

  const openEditTour = (t: PlanTour) => {
    setEditTour(t)
    setTourForm({
      name: t.name, description: t.description || '',
      price_per_person_usd: t.price_per_person_usd,
      is_active: t.is_active === 1,
    })
    setTourModal(true)
  }

  const saveTour = async () => {
    if (!selectedId) return
    try {
      const method = editTour ? 'PUT' : 'POST'
      const body = editTour
        ? { id: editTour.id, ...tourForm }
        : { plan_id: selectedId, ...tourForm, sort_order: (selected?.tours?.length || 0) + 1 }
      const res = await adminFetch('/api/admin/plans/tours', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editTour ? 'Tour updated' : 'Tour added')
        setTourModal(false)
        fetchPlans()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save tour')
      }
    } catch { showToast('Error saving tour') }
  }

  const deleteTour = async (id: number) => {
    const res = await adminFetch(`/api/admin/plans/tours?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Tour deleted')
      fetchPlans()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">Loading plans...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      {/* ── HEADER ── */}
      <div className="drivers-hero">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter text-fg">
            {t.admin.plans.title}
          </h1>
          <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
            {t.admin.plans.subtitle}
          </p>
        </div>
        <div className="drivers-toolbar flex items-center gap-2.5 flex-wrap">
          <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreatePlan}>
            + {t.admin.plans.addPlan}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="drivers-kpis grid-6">
        {[
          ['Total Plans', String(stats.total), 'All plans', true],
          ['Active', String(stats.active), 'Live plans', true],
          ['Popular', String(stats.popular), 'Featured', false],
          ['Avg Price', `$${stats.avgPrice}`, 'Per plan', false],
          ['Features', String(stats.totalFeatures), 'Across plans', true],
          ['Tours', String(stats.totalTours), 'Across plans', true],
        ].map(([label, value, sub, positive], idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className={`stat-change ${positive ? 'up' : 'down'}`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="drivers-layout">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>{t.admin.plans.title}</span>
              <span className="count">{plans.length} listed</span>
            </div>
          </div>

          <div className="driver-grid">
            {plans.length === 0 ? (
              <p className="text-fg-muted text-center py-12" style={{ gridColumn: '1/-1' }}>
                {t.admin.plans.noPlans}. Click &ldquo;+ {t.admin.plans.addPlan}&rdquo; to create the first one.
              </p>
            ) : [...plans].sort((a, b) => a.sort_order - b.sort_order).map((p, idx) => (
              <div
                key={p.id}
                className={`driver-card ${selectedId === p.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(p.id); setTab('features') }}
              >
                <div className="driver-head">
                  <div className="driver-person">
                    <div className="driver-avatar" style={{
                      background: p.is_popular
                        ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                        : 'linear-gradient(135deg, var(--accent), #059669)',
                      fontSize: 18, fontWeight: 700,
                    }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="driver-name">
                        {p.name}
                        {p.is_popular === 1 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b] text-white">
                            {t.admin.plans.popular}
                          </span>
                        )}
                      </div>
                      <div className="driver-meta">
                        ${Number(p.price_usd).toFixed(2)} · {p.description?.slice(0, 40) || 'No description'}
                      </div>
                    </div>
                  </div>
                  <span className={p.is_active === 1 ? 'badge badge-accent' : 'badge'}>
                    {p.is_active === 1 ? t.admin.plans.active : t.admin.plans.inactive}
                  </span>
                </div>

                <div className="driver-stats">
                  <div className="driver-stat">
                    <strong>{p.features?.length || 0}</strong>
                    <span>{t.admin.plans.features}</span>
                  </div>
                  <div className="driver-stat">
                    <strong>{p.tours?.length || 0}</strong>
                    <span>{t.admin.plans.tours}</span>
                  </div>
                  <div className="driver-stat">
                    <strong>${Number(p.price_usd).toFixed(0)}</strong>
                    <span>Price</span>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap mt-2">
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); openEditPlan(p) }}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); deletePlan(p.id) }} style={{ color: '#ef4444' }}>
                    Delete
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={e => { e.stopPropagation(); movePlan(p.id, 'up') }}
                    disabled={idx === 0}
                    title="Move up"
                  >↑</button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={e => { e.stopPropagation(); movePlan(p.id, 'down') }}
                    disabled={idx === plans.length - 1}
                    title="Move down"
                  >↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: DETAIL PANEL ── */}
        <aside className="side-stack">
          {/* Plan Info */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title font-medium text-fg">Plan Details</span>
            </div>
            <div className="panel-body p-4">
              {!selected ? (
                <p className="text-fg-muted text-center py-8">Select a plan to manage</p>
              ) : (
                <div>
                  <div className="profile-top">
                    <div className="profile-photo" style={{
                      background: selected.is_popular
                        ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                        : 'linear-gradient(135deg, var(--accent), #059669)',
                      fontSize: 28, fontWeight: 700,
                    }}>
                      {selected.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-fg">{selected.name}</h2>
                      <div className="sub">{selected.description || 'No description'}</div>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        <span className={selected.is_active === 1 ? 'badge badge-accent' : 'badge'}>
                          {selected.is_active === 1 ? t.admin.plans.active : t.admin.plans.inactive}
                        </span>
                        {selected.is_popular === 1 && (
                          <span className="badge" style={{ background: '#f59e0b', color: '#fff' }}>
                            {t.admin.plans.popular}
                          </span>
                        )}
                        <span className="badge badge-info">${Number(selected.price_usd).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="info-grid mt-4">
                    {[
                      ['Slug', selected.slug],
                      ['Price', `$${Number(selected.price_usd).toFixed(2)}`],
                      ['Sort Order', String(selected.sort_order)],
                      ['Features', `${selected.features?.length || 0}`],
                      ['Tours', `${selected.tours?.length || 0}`],
                      ['Created', selected.created_at?.split('T')[0] || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="info-item">
                        <label>{label}</label>
                        <div>{value}</div>
                      </div>
                    ))}
                  </div>
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
                    ['features', t.admin.plans.features],
                    ['tours', t.admin.plans.tours],
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
                <button className="btn btn-sm btn-secondary" onClick={tab === 'features' ? openCreateFeature : openCreateTour}>
                  + {tab === 'features' ? t.admin.plans.addFeature : t.admin.plans.addTour}
                </button>
              </div>

              <div className="panel-body p-4">
                {/* Features tab */}
                {tab === 'features' && (
                  !selected.features || selected.features.length === 0 ? (
                    <p className="text-fg-muted text-center py-6">No features yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selected.features.sort((a, b) => a.sort_order - b.sort_order).map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div>
                            <div className="font-medium text-fg text-[14px]">{f.text}</div>
                            <div className="text-fg-muted text-[12px]">Order: {f.sort_order}</div>
                          </div>
                          <div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditFeature(f)}>Edit</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => deleteFeature(f.id)} style={{ color: '#ef4444' }}>Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Tours tab */}
                {tab === 'tours' && (
                  !selected.tours || selected.tours.length === 0 ? (
                    <p className="text-fg-muted text-center py-6">No tours yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selected.tours.sort((a, b) => a.sort_order - b.sort_order).map(tour => (
                        <div key={tour.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div>
                            <div className="font-medium text-fg text-[14px]">{tour.name}</div>
                            <div className="text-fg-muted text-[12px]">
                              ${Number(tour.price_per_person_usd).toFixed(2)}/person · {tour.is_active ? t.admin.plans.active : t.admin.plans.inactive}
                            </div>
                            {tour.description && (
                              <div className="text-fg-muted text-[11px] mt-1">{tour.description}</div>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditTour(tour)}>Edit</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => deleteTour(tour.id)} style={{ color: '#ef4444' }}>Del</button>
                          </div>
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

      {/* ── PLAN MODAL ── */}
      {planModal && (
        <Modal onClose={() => setPlanModal(false)} title={editPlan ? t.admin.plans.editPlan : t.admin.plans.addPlan}>
          <ModalField label={t.admin.plans.planName}>
            <input value={planForm.name || ''} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Welcome Pack" />
          </ModalField>
          <ModalField label={t.admin.plans.description}>
            <textarea rows={3} value={planForm.description || ''} onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))} placeholder="Plan description..." />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label={t.admin.plans.priceUsd}>
              <input type="number" step="0.01" min="0" value={planForm.price_usd || 0}
                onChange={e => setPlanForm(p => ({ ...p, price_usd: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
            </ModalField>
            <ModalField label={t.admin.plans.sortOrder}>
              <input type="number" min="0" value={planForm.sort_order || 0}
                onChange={e => setPlanForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </ModalField>
            <ModalField label={t.admin.plans.isPopular}>
              <select value={planForm.is_popular ? '1' : '0'} onChange={e => setPlanForm(p => ({ ...p, is_popular: e.target.value === '1' }))}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </ModalField>
            <ModalField label={t.admin.plans.isActive}>
              <select value={planForm.is_active ? '1' : '0'} onChange={e => setPlanForm(p => ({ ...p, is_active: e.target.value === '1' }))}>
                <option value="1">{t.admin.plans.active}</option>
                <option value="0">{t.admin.plans.inactive}</option>
              </select>
            </ModalField>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setPlanModal(false)}>{t.admin.plans.cancel}</button>
            <button className="btn btn-primary" onClick={savePlan}>{t.admin.plans.save}</button>
          </div>
        </Modal>
      )}

      {/* ── FEATURE MODAL ── */}
      {featureModal && (
        <Modal onClose={() => setFeatureModal(false)} title={editFeature ? 'Edit Feature' : t.admin.plans.addFeature}>
          <ModalField label={t.admin.plans.featureText}>
            <input value={featureForm.text || ''} onChange={e => setFeatureForm(p => ({ ...p, text: e.target.value }))} placeholder="e.g. VIP Airport Pickup" />
          </ModalField>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setFeatureModal(false)}>{t.admin.plans.cancel}</button>
            <button className="btn btn-primary" onClick={saveFeature}>{t.admin.plans.save}</button>
          </div>
        </Modal>
      )}

      {/* ── TOUR MODAL ── */}
      {tourModal && (
        <Modal onClose={() => setTourModal(false)} title={editTour ? 'Edit Tour' : t.admin.plans.addTour}>
          <ModalField label={t.admin.plans.tourName}>
            <input value={tourForm.name || ''} onChange={e => setTourForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. City Tour" />
          </ModalField>
          <ModalField label={t.admin.plans.tourDescription}>
            <textarea rows={2} value={tourForm.description || ''} onChange={e => setTourForm(p => ({ ...p, description: e.target.value }))} placeholder="Tour description..." />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label={t.admin.plans.pricePerPerson}>
              <input type="number" step="0.01" min="0" value={tourForm.price_per_person_usd || 0}
                onChange={e => setTourForm(p => ({ ...p, price_per_person_usd: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
            </ModalField>
            <ModalField label={t.admin.plans.isActive}>
              <select value={tourForm.is_active ? '1' : '0'} onChange={e => setTourForm(p => ({ ...p, is_active: e.target.value === '1' }))}>
                <option value="1">{t.admin.plans.active}</option>
                <option value="0">{t.admin.plans.inactive}</option>
              </select>
            </ModalField>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setTourModal(false)}>{t.admin.plans.cancel}</button>
            <button className="btn btn-primary" onClick={saveTour}>{t.admin.plans.save}</button>
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
      <div className="[&>input]:w-full [&>input]:px-3 [&>input]:py-2 [&>input]:rounded-lg [&>input]:bg-[var(--bg-dark)] [&>input]:border [&>input]:border-[var(--border)] [&>input]:text-[var(--fg)] [&>input]:text-[13px] [&>input]:outline-none [&>input]:focus:border-[var(--accent-gold)] [&>input]:transition-colors [&>textarea]:w-full [&>textarea]:px-3 [&>textarea]:py-2 [&>textarea]:rounded-lg [&>textarea]:bg-[var(--bg-dark)] [&>textarea]:border [&>textarea]:border-[var(--border)] [&>textarea]:text-[var(--fg)] [&>textarea]:text-[13px] [&>textarea]:outline-none [&>textarea]:focus:border-[var(--accent-gold)] [&>textarea]:transition-colors [&>select]:w-full [&>select]:px-3 [&>select]:py-2 [&>select]:rounded-lg [&>select]:bg-[var(--bg-dark)] [&>select]:border [&>select]:border-[var(--border)] [&>select]:text-[var(--fg)] [&>select]:text-[13px] [&>select]:outline-none [&>select]:focus:border-[var(--accent-gold)] [&>select]:transition-colors">
        {children}
      </div>
    </div>
  )
}
