'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface PackageTour {
  id: number
  package_id: number
  name: string
  description: string
  price_per_person_usd: number
  vehicle_type: string
  duration_hours: number
  max_people: number
  is_active: boolean
  sort_order: number
}

interface Package {
  id: number
  slug: string
  name: string
  description: string
  base_price_usd: number
  service_fee_flat: number
  includes_pickup: boolean
  includes_sim: boolean
  includes_accompaniment: boolean
  accompaniment_hours: number
  accompaniment_type: string | null
  includes_round_trip: boolean
  includes_concierge: boolean
  is_popular: boolean
  is_active: boolean
  sort_order: number
  features: Array<{ id: number; text: string; sort_order: number }>
  tours: PackageTour[]
}

export default function PlansPage() {
  const { t } = useI18n()
  const { showToast } = useToast()

  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState<'features' | 'tours'>('features')

  // Package modal
  const [pkgModal, setPkgModal] = useState(false)
  const [editPkg, setEditPkg] = useState<Package | null>(null)
  const [pkgForm, setPkgForm] = useState<Record<string, any>>({})

  // Feature modal
  const [featureModal, setFeatureModal] = useState(false)
  const [editFeature, setEditFeature] = useState<{ id?: number; text: string } | null>(null)
  const [featureText, setFeatureText] = useState('')

  // Tour modal
  const [tourModal, setTourModal] = useState(false)
  const [editTour, setEditTour] = useState<PackageTour | null>(null)
  const [tourForm, setTourForm] = useState<Record<string, any>>({})

  const fetchPackages = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(data.packages || [])
      }
    } catch (e) { console.error('Failed to fetch packages', e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  const selected = packages.find(p => p.id === selectedId)

  const stats = {
    total: packages.length,
    active: packages.filter(p => p.is_active).length,
    popular: packages.filter(p => p.is_popular).length,
    totalFeatures: packages.reduce((s, p) => s + (p.features?.length || 0), 0),
    totalTours: packages.reduce((s, p) => s + (p.tours?.length || 0), 0),
    avgPrice: packages.length
      ? Math.round(packages.reduce((s, p) => s + Number(p.base_price_usd || 0), 0) / packages.length)
      : 0,
  }

  // ───── Package CRUD ─────
  const openCreatePkg = () => {
    setEditPkg(null)
    setPkgForm({
      name: '', description: '', base_price_usd: 0, service_fee_flat: 0,
      includes_pickup: true, includes_sim: false, includes_accompaniment: false,
      accompaniment_hours: 0, accompaniment_type: '',
      includes_round_trip: false, includes_concierge: false,
      is_popular: false, is_active: true, sort_order: packages.length,
    })
    setPkgModal(true)
  }

  const openEditPkg = (p: Package) => {
    setEditPkg(p)
    setPkgForm({
      name: p.name, description: p.description || '',
      base_price_usd: p.base_price_usd, service_fee_flat: p.service_fee_flat,
      includes_pickup: p.includes_pickup, includes_sim: p.includes_sim,
      includes_accompaniment: p.includes_accompaniment, accompaniment_hours: p.accompaniment_hours,
      accompaniment_type: p.accompaniment_type || '',
      includes_round_trip: p.includes_round_trip, includes_concierge: p.includes_concierge,
      is_popular: p.is_popular, is_active: p.is_active, sort_order: p.sort_order,
    })
    setPkgModal(true)
  }

  const savePkg = async () => {
    try {
      const method = editPkg ? 'PUT' : 'POST'
      const body = editPkg
        ? { id: editPkg.id, ...pkgForm, features: selected?.features || [], tours: selected?.tours?.map(t => ({
            id: t.id, name: t.name, description: t.description, price_per_person_usd: t.price_per_person_usd,
            vehicle_type: t.vehicle_type, duration_hours: t.duration_hours, max_people: t.max_people,
            is_active: t.is_active,
          })) || [] }
        : pkgForm
      const res = await adminFetch('/api/admin/packages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editPkg ? 'Package updated ✓' : 'Package created ✓')
        setPkgModal(false)
        fetchPackages()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save package')
      }
    } catch { showToast('Error saving package') }
  }

  const deletePkg = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    const res = await adminFetch(`/api/admin/packages?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Package deleted ✓')
      if (selectedId === id) setSelectedId(null)
      fetchPackages()
    }
  }

  // ───── Reorder ─────
  const movePkg = async (pkgId: number, direction: 'up' | 'down') => {
    const sorted = [...packages].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(p => p.id === pkgId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const temp = sorted[idx].sort_order
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order }
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: temp }
    // Save each package with its new sort_order
    for (const pkg of sorted) {
      await adminFetch('/api/admin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pkg.id, sort_order: pkg.sort_order, features: pkg.features, tours: pkg.tours }),
      })
    }
    fetchPackages()
  }

  // ───── Feature CRUD (via inline PUT) ─────
  const openCreateFeature = () => { setEditFeature(null); setFeatureText(''); setFeatureModal(true) }
  const openEditFeature = (f: { id?: number; text: string }) => { setEditFeature(f); setFeatureText(f.text); setFeatureModal(true) }

  const saveFeature = async () => {
    if (!selected) return
    const features = [...(selected.features || [])]
    if (editFeature?.id) {
      const idx = features.findIndex(f => f.id === editFeature.id)
      if (idx >= 0) features[idx] = { ...features[idx], text: featureText }
    } else {
      features.push({ id: Date.now(), text: featureText, sort_order: features.length + 1 })
    }
    const res = await adminFetch('/api/admin/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, features, tours: selected.tours }),
    })
    if (res.ok) { showToast(editFeature ? 'Feature updated' : 'Feature added'); setFeatureModal(false); fetchPackages() }
  }

  const deleteFeature = async (featureId: number) => {
    if (!selected) return
    const features = selected.features.filter(f => f.id !== featureId)
    const res = await adminFetch('/api/admin/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, features, tours: selected.tours }),
    })
    if (res.ok) { showToast('Feature deleted'); fetchPackages() }
  }

  // ───── Tour CRUD (via inline PUT) ─────
  const openCreateTour = () => {
    setEditTour(null)
    setTourForm({ name: '', description: '', price_per_person_usd: 0, vehicle_type: 'suv', duration_hours: 8, max_people: 10, is_active: true })
    setTourModal(true)
  }

  const openEditTour = (t: PackageTour) => {
    setEditTour(t)
    setTourForm({ name: t.name, description: t.description || '', price_per_person_usd: t.price_per_person_usd, vehicle_type: t.vehicle_type || 'suv', duration_hours: t.duration_hours || 8, max_people: t.max_people || 10, is_active: t.is_active })
    setTourModal(true)
  }

  const saveTour = async () => {
    if (!selected) return
    const tours = [...(selected.tours || [])]
    if (editTour) {
      const idx = tours.findIndex(t => t.id === editTour.id)
      if (idx >= 0) tours[idx] = { ...tours[idx], ...tourForm }
    } else {
      tours.push({ id: Date.now(), package_id: selected.id, ...tourForm, sort_order: tours.length + 1 } as PackageTour)
    }
    const res = await adminFetch('/api/admin/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, features: selected.features, tours }),
    })
    if (res.ok) { showToast(editTour ? 'Tour updated' : 'Tour added'); setTourModal(false); fetchPackages() }
  }

  const deleteTour = async (tourId: number) => {
    if (!selected) return
    const tours = selected.tours.filter(t => t.id !== tourId)
    const res = await adminFetch('/api/admin/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, features: selected.features, tours }),
    })
    if (res.ok) { showToast('Tour deleted'); fetchPackages() }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#646880]">Loading packages...</div></div>
  }

  return (
    <div style={{ padding: 0 }}>
      {/* ── HEADER ── */}
      <div className="drivers-hero">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter text-fg">{t.admin.plans.title}</h1>
          <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
            {t.admin.plans.subtitle}
          </p>
        </div>
        <div className="drivers-toolbar flex items-center gap-2.5 flex-wrap">
          <button className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all" onClick={openCreatePkg}>
            + Add Package
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="drivers-kpis grid-6">
        {[
          ['Total', String(stats.total), 'Packages', true],
          ['Active', String(stats.active), 'Live', true],
          ['Popular', String(stats.popular), 'Featured', false],
          ['Avg Price', `$${stats.avgPrice}`, 'Per package', false],
          ['Features', String(stats.totalFeatures), 'Across packages', true],
          ['Tours', String(stats.totalTours), 'Across packages', true],
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
              <span>Packages</span>
              <span className="count">{packages.length} listed</span>
            </div>
          </div>

          <div className="driver-grid">
            {packages.length === 0 ? (
              <p className="text-fg-muted text-center py-12" style={{ gridColumn: '1/-1' }}>No packages yet. Click "+ Add Package" to create the first one.</p>
            ) : [...packages].sort((a, b) => a.sort_order - b.sort_order).map((p, idx) => (
              <div key={p.id} className={`driver-card ${selectedId === p.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(p.id); setTab('features') }}>
                <div className="driver-head">
                  <div className="driver-person">
                    <div className="driver-avatar" style={{
                      background: p.is_popular ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, var(--accent), #059669)',
                      fontSize: 18, fontWeight: 700,
                    }}>{p.name.charAt(0)}</div>
                    <div>
                      <div className="driver-name">
                        {p.name}
                        {p.is_popular && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b] text-white">Popular</span>}
                      </div>
                      <div className="driver-meta">
                        ${Number(p.base_price_usd).toFixed(0)} · {p.description?.slice(0, 40) || 'No description'}
                      </div>
                    </div>
                  </div>
                  <span className={p.is_active ? 'badge badge-accent' : 'badge'}>{p.is_active ? 'Active' : 'Inactive'}</span>
                </div>

                <div className="driver-stats">
                  <div className="driver-stat"><strong>{p.features?.length || 0}</strong><span>Features</span></div>
                  <div className="driver-stat"><strong>{p.tours?.length || 0}</strong><span>Tours</span></div>
                  <div className="driver-stat"><strong>${Number(p.base_price_usd).toFixed(0)}</strong><span>Price</span></div>
                </div>

                <div className="flex gap-1.5 flex-wrap mt-2">
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); openEditPkg(p) }}>Edit</button>
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); deletePkg(p.id) }} style={{ color: '#ef4444' }}>Delete</button>
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); movePkg(p.id, 'up') }} disabled={idx === 0}>↑</button>
                  <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); movePkg(p.id, 'down') }} disabled={idx === packages.length - 1}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: DETAIL PANEL ── */}
        <aside className="side-stack">
          <div className="panel">
            <div className="panel-header"><span className="panel-title font-medium text-fg">Package Details</span></div>
            <div className="panel-body p-4">
              {!selected ? (
                <p className="text-fg-muted text-center py-8">Select a package to manage</p>
              ) : (
                <div>
                  <div className="profile-top">
                    <div className="profile-photo" style={{
                      background: selected.is_popular ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, var(--accent), #059669)',
                      fontSize: 28, fontWeight: 700,
                    }}>{selected.name.charAt(0)}</div>
                    <div>
                      <h2 className="text-[18px] font-bold text-fg">{selected.name}</h2>
                      <div className="sub">{selected.description || 'No description'}</div>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        <span className={selected.is_active ? 'badge badge-accent' : 'badge'}>{selected.is_active ? 'Active' : 'Inactive'}</span>
                        {selected.is_popular && <span className="badge" style={{ background: '#f59e0b', color: '#fff' }}>Popular</span>}
                        <span className="badge badge-info">${Number(selected.base_price_usd).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="info-grid mt-4">
                    {[
                      ['Price', `$${Number(selected.base_price_usd).toFixed(2)}`],
                      ['Service Fee (flat)', `$${Number(selected.service_fee_flat).toFixed(2)}`],
                      ['Pickup', selected.includes_pickup ? '✓' : '—'],
                      ['SIM', selected.includes_sim ? '✓' : '—'],
                      ['Accompaniment', selected.includes_accompaniment ? `${selected.accompaniment_hours}h` : '—'],
                      ['Round-trip', selected.includes_round_trip ? '✓' : '—'],
                      ['Concierge', selected.includes_concierge ? '✓' : '—'],
                      ['Features', `${selected.features?.length || 0}`],
                      ['Tours', `${selected.tours?.length || 0}`],
                    ].map(([label, value]) => (
                      <div key={label} className="info-item"><label>{label}</label><div>{value}</div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="panel">
              <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['features', 'tours'] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key as 'features' | 'tours')} style={{
                      padding: '8px 16px', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      background: tab === key ? 'var(--surface)' : 'transparent',
                      color: tab === key ? 'var(--fg)' : 'var(--fg-muted)',
                      borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                    }}>{label}</button>
                  ))}
                </div>
                <button className="btn btn-sm btn-secondary" onClick={tab === 'features' ? openCreateFeature : openCreateTour}>
                  + {tab === 'features' ? 'Add Feature' : 'Add Tour'}
                </button>
              </div>

              <div className="panel-body p-4">
                {tab === 'features' && (
                  !selected.features?.length ? <p className="text-fg-muted text-center py-6">No features yet</p> : (
                    <div className="flex flex-col gap-2">
                      {selected.features.sort((a, b) => a.sort_order - b.sort_order).map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div className="font-medium text-fg text-[14px]">{f.text}</div>
                          <div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditFeature(f)}>Edit</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => deleteFeature(f.id)} style={{ color: '#ef4444' }}>Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {tab === 'tours' && (
                  !selected.tours?.length ? <p className="text-fg-muted text-center py-6">No tours yet</p> : (
                    <div className="flex flex-col gap-2">
                      {selected.tours.sort((a, b) => a.sort_order - b.sort_order).map(tour => (
                        <div key={tour.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div>
                            <div className="font-medium text-fg text-[14px]">{tour.name}</div>
                            <div className="text-fg-muted text-[12px]">
                              ${Number(tour.price_per_person_usd).toFixed(2)}/person · {tour.vehicle_type?.toUpperCase()} · {tour.duration_hours}h
                            </div>
                            {tour.description && <div className="text-fg-muted text-[11px] mt-1">{tour.description}</div>}
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

      {/* ── PACKAGE MODAL ── */}
      {pkgModal && (
        <Modal onClose={() => setPkgModal(false)} title={editPkg ? 'Edit Package' : 'Add Package'}>
          <ModalField label="Package Name">
            <input value={pkgForm.name || ''} onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Full Insider" />
          </ModalField>
          <ModalField label="Description">
            <textarea rows={2} value={pkgForm.description || ''} onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))} placeholder="Package description..." />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Price (USD)">
              <input type="number" step="0.01" min="0" value={pkgForm.base_price_usd || 0}
                onChange={e => setPkgForm(p => ({ ...p, base_price_usd: parseFloat(e.target.value) || 0 }))} />
            </ModalField>
            <ModalField label="Service Fee (flat)">
              <input type="number" step="0.01" min="0" value={pkgForm.service_fee_flat || 0}
                onChange={e => setPkgForm(p => ({ ...p, service_fee_flat: parseFloat(e.target.value) || 0 }))} />
            </ModalField>
          </div>

          <div className="mt-4 mb-2 text-[11px] font-semibold text-fg-secondary uppercase tracking-wide">Services Included</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['includes_pickup', 'Airport Pickup'],
              ['includes_sim', 'SIM/eSIM'],
              ['includes_accompaniment', 'Accompaniment (Bilingual Fixer)'],
              ['includes_round_trip', 'Round-trip Transfer'],
              ['includes_concierge', '24/7 Concierge'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[13px] text-fg cursor-pointer">
                <input type="checkbox" checked={!!pkgForm[key]} onChange={e => setPkgForm(p => ({ ...p, [key]: e.target.checked }))} className="accent-[var(--accent)]" />
                {label}
              </label>
            ))}
          </div>

          {pkgForm.includes_accompaniment && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <ModalField label="Accompaniment Hours">
                <input type="number" min="0" value={pkgForm.accompaniment_hours || 0}
                  onChange={e => setPkgForm(p => ({ ...p, accompaniment_hours: parseInt(e.target.value) || 0 }))} />
              </ModalField>
              <ModalField label="Type">
                <select value={pkgForm.accompaniment_type || ''} onChange={e => setPkgForm(p => ({ ...p, accompaniment_type: e.target.value }))}>
                  <option value="">None</option>
                  <option value="bilingual_fixer">Bilingual Fixer</option>
                </select>
              </ModalField>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <ModalField label="Sort Order">
              <input type="number" min="0" value={pkgForm.sort_order || 0}
                onChange={e => setPkgForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </ModalField>
            <ModalField label="Status">
              <select value={pkgForm.is_active ? '1' : '0'} onChange={e => setPkgForm(p => ({ ...p, is_active: e.target.value === '1' }))}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </ModalField>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-[13px] text-fg cursor-pointer">
              <input type="checkbox" checked={!!pkgForm.is_popular} onChange={e => setPkgForm(p => ({ ...p, is_popular: e.target.checked }))} className="accent-[#f59e0b]" />
              Mark as Popular
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setPkgModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={savePkg}>Save</button>
          </div>
        </Modal>
      )}

      {/* ── FEATURE MODAL ── */}
      {featureModal && (
        <Modal onClose={() => setFeatureModal(false)} title={editFeature ? 'Edit Feature' : 'Add Feature'}>
          <ModalField label="Feature Text">
            <input value={featureText} onChange={e => setFeatureText(e.target.value)} placeholder="e.g. VIP Airport Pickup" />
          </ModalField>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setFeatureModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveFeature}>Save</button>
          </div>
        </Modal>
      )}

      {/* ── TOUR MODAL ── */}
      {tourModal && (
        <Modal onClose={() => setTourModal(false)} title={editTour ? 'Edit Tour' : 'Add Tour'}>
          <ModalField label="Tour Name">
            <input value={tourForm.name || ''} onChange={e => setTourForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Guatapé Day Trip" />
          </ModalField>
          <ModalField label="Description">
            <textarea rows={2} value={tourForm.description || ''} onChange={e => setTourForm(p => ({ ...p, description: e.target.value }))} placeholder="Tour description..." />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Price per person (USD)">
              <input type="number" step="0.01" min="0" value={tourForm.price_per_person_usd || 0}
                onChange={e => setTourForm(p => ({ ...p, price_per_person_usd: parseFloat(e.target.value) || 0 }))} />
            </ModalField>
            <ModalField label="Vehicle">
              <select value={tourForm.vehicle_type || 'suv'} onChange={e => setTourForm(p => ({ ...p, vehicle_type: e.target.value }))}>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
                <option value="sedan">Sedan</option>
              </select>
            </ModalField>
            <ModalField label="Duration (hours)">
              <input type="number" min="1" value={tourForm.duration_hours || 8}
                onChange={e => setTourForm(p => ({ ...p, duration_hours: parseInt(e.target.value) || 8 }))} />
            </ModalField>
            <ModalField label="Max people">
              <input type="number" min="1" value={tourForm.max_people || 10}
                onChange={e => setTourForm(p => ({ ...p, max_people: parseInt(e.target.value) || 10 }))} />
            </ModalField>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-[13px] text-fg cursor-pointer">
              <input type="checkbox" checked={!!tourForm.is_active} onChange={e => setTourForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-[var(--accent)]" />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={() => setTourModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTour}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Reusable modal shell ──
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 24px', zIndex: 500 }} onClick={onClose}>
      <div style={{ width: 'min(600px, 100%)', maxHeight: '80vh', overflow: 'auto', borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
