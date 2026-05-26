'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';

interface DocumentItem {
  name: string; status: string; state: 'ok' | 'warn' | 'bad'
}
interface DriverHistory {
  name: string; period: string
}
interface MaintenanceEntry {
  date: string; desc: string; cost: string
}
interface Vehicle {
  id: number; name: string; plate: string; category: string; status: string
  driver: string | null; driverInit: string | null; soatOk: boolean; inspOk: boolean
  year: string; capacity: string
  emoji: string
  documents: DocumentItem[]
  driverHistory: DriverHistory[]
  maintenanceLog: MaintenanceEntry[]
  nextService: string
  trips: number; km: number; revenue: number
}

const allVehicles: Vehicle[] = [
  { id: 1, name: 'Mercedes V-Class', plate: 'MDE-782', category: 'vip-suv', status: 'available', driver: 'Carlos M.', driverInit: 'CM', soatOk: true, inspOk: true, year: '2024', capacity: '7 pax', emoji: '🚐', trips: 128, km: 18400, revenue: 48600, nextService: '18,000 km or Nov 2026', documents: [{ name: 'SOAT Insurance', status: 'Valid until Dec 2026', state: 'ok' }, { name: 'Technical Inspection', status: 'Valid until Mar 2027', state: 'ok' }, { name: 'Comprehensive Insurance', status: 'Valid until Oct 2026', state: 'ok' }], driverHistory: [{ name: 'Carlos M.', period: 'Mar 2025 — Present' }, { name: 'Andrés R.', period: 'Nov 2024 — Feb 2025' }], maintenanceLog: [{ date: 'Apr 10, 2026', desc: 'Oil change', cost: '$180' }, { date: 'Jan 22, 2026', desc: 'Brake pads replacement', cost: '$340' }, { date: 'Sep 15, 2025', desc: 'General service (20K km)', cost: '$520' }] },
  { id: 2, name: 'BMW X5', plate: 'MDE-511', category: 'suv', status: 'in_service', driver: 'María G.', driverInit: 'MG', soatOk: true, inspOk: false, year: '2023', capacity: '5 pax', emoji: '🚙', trips: 94, km: 22300, revenue: 35200, nextService: 'Tomorrow (oil change)', documents: [{ name: 'SOAT Insurance', status: 'Valid until Oct 2026', state: 'ok' }, { name: 'Technical Inspection', status: 'Expiring Aug 2026', state: 'warn' }, { name: 'Comprehensive Insurance', status: 'Valid until Sep 2026', state: 'ok' }], driverHistory: [{ name: 'María G.', period: 'Jan 2025 — Present' }], maintenanceLog: [{ date: 'May 20, 2026', desc: 'Oil change due', cost: '—' }] },
  { id: 3, name: 'Mercedes S-Class', plate: 'VIP-001', category: 'luxury', status: 'available', driver: 'Felipe L.', driverInit: 'FL', soatOk: true, inspOk: true, year: '2025', capacity: '4 pax', emoji: '👑', trips: 56, km: 8900, revenue: 62400, nextService: '15,000 km (est. Aug 2026)', documents: [{ name: 'SOAT Insurance', status: 'Valid until Feb 2027', state: 'ok' }, { name: 'Technical Inspection', status: 'Valid until Jan 2027', state: 'ok' }, { name: 'Comprehensive Insurance', status: 'Valid until Mar 2027', state: 'ok' }], driverHistory: [{ name: 'Felipe L.', period: 'Feb 2025 — Present' }], maintenanceLog: [{ date: 'Jun 1, 2026', desc: 'Software update', cost: '$0' }, { date: 'Mar 10, 2026', desc: 'General service (5K km)', cost: '$420' }] },
  { id: 4, name: 'Toyota Hilux', plate: 'MDE-223', category: 'standard', status: 'maintenance', driver: null, driverInit: null, soatOk: true, inspOk: false, year: '2022', capacity: '5 pax', emoji: '🚗', trips: 210, km: 45600, revenue: 28100, nextService: 'Jul 15 (inspection)', documents: [{ name: 'SOAT Insurance', status: 'Valid until Jan 2027', state: 'ok' }, { name: 'Technical Inspection', status: 'Expired — Jul 15 scheduled', state: 'bad' }, { name: 'Comprehensive Insurance', status: 'Valid until Jun 2026', state: 'warn' }], driverHistory: [{ name: 'Andrés R.', period: 'Jun 2024 — Feb 2025' }, { name: 'Pedro A.', period: 'Jan 2023 — May 2024' }], maintenanceLog: [{ date: 'Jul 8, 2026', desc: 'Technical inspection appointment', cost: '—' }, { date: 'May 12, 2026', desc: 'Transmission service', cost: '$680' }, { date: 'Feb 20, 2026', desc: 'Tire replacement (4x)', cost: '$520' }] },
  { id: 5, name: 'Chevrolet Traverse', plate: 'MDE-334', category: 'suv', status: 'available', driver: 'Diego P.', driverInit: 'DP', soatOk: true, inspOk: true, year: '2023', capacity: '7 pax', emoji: '🚙', trips: 72, km: 12100, revenue: 22300, nextService: 'Aug 1 (SOAT renewal)', documents: [{ name: 'SOAT Insurance', status: 'Expiring Aug 1, 2026', state: 'warn' }, { name: 'Technical Inspection', status: 'Valid until Nov 2026', state: 'ok' }, { name: 'Comprehensive Insurance', status: 'Valid until Dec 2026', state: 'ok' }], driverHistory: [{ name: 'Diego P.', period: 'Aug 2024 — Present' }], maintenanceLog: [{ date: 'Apr 5, 2026', desc: 'Oil change', cost: '$120' }, { date: 'Jan 18, 2026', desc: 'General checkup', cost: '$200' }] },
  { id: 6, name: 'Porsche Cayenne', plate: 'MDE-890', category: 'luxury', status: 'available', driver: 'Laura C.', driverInit: 'LC', soatOk: true, inspOk: true, year: '2024', capacity: '5 pax', emoji: '👑', trips: 41, km: 6700, revenue: 38600, nextService: '15,000 km', documents: [{ name: 'SOAT Insurance', status: 'Valid until Apr 2027', state: 'ok' }, { name: 'Technical Inspection', status: 'Valid until Mar 2027', state: 'ok' }, { name: 'Comprehensive Insurance', status: 'Valid until Jun 2027', state: 'ok' }], driverHistory: [{ name: 'Laura C.', period: 'Jan 2025 — Present' }], maintenanceLog: [{ date: 'May 15, 2026', desc: 'First service (5K km)', cost: '$580' }] },
  { id: 7, name: 'Toyota Hiace', plate: 'MDE-567', category: 'van', status: 'in_service', driver: 'Pedro A.', driverInit: 'PA', soatOk: true, inspOk: true, year: '2023', capacity: '14 pax', emoji: '🚐', trips: 186, km: 38200, revenue: 41500, nextService: '45,000 km (est. Sep 2026)', documents: [{ name: 'SOAT Insurance', status: 'Valid until Sep 2026', state: 'ok' }, { name: 'Technical Inspection', status: 'Valid until Oct 2026', state: 'ok' }, { name: 'Comprehensive Insurance', status: 'Valid until Aug 2026', state: 'ok' }], driverHistory: [{ name: 'Pedro A.', period: 'Jun 2024 — Present' }, { name: 'Carlos M.', period: 'Jan 2024 — May 2024' }], maintenanceLog: [{ date: 'Apr 22, 2026', desc: 'Brake service', cost: '$290' }, { date: 'Jan 5, 2026', desc: 'Oil change + filter', cost: '$160' }, { date: 'Aug 30, 2025', desc: 'AC repair', cost: '$380' }] },
  { id: 8, name: 'Nissan Pathfinder', plate: 'MDE-678', category: 'suv', status: 'available', driver: null, driverInit: null, soatOk: true, inspOk: true, year: '2024', capacity: '7 pax', emoji: '🚙', trips: 63, km: 14800, revenue: 19200, nextService: '20,000 km (est. Oct 2026)', documents: [{ name: 'SOAT Insurance', status: 'Valid until Nov 2026', state: 'ok' }, { name: 'Technical Inspection', status: 'Valid until Dec 2026', state: 'ok' }, { name: 'Comprehensive Insurance', status: 'Valid until Feb 2027', state: 'ok' }], driverHistory: [{ name: 'Sofia R.', period: 'Oct 2024 — Mar 2026' }], maintenanceLog: [{ date: 'Mar 8, 2026', desc: 'Oil change', cost: '$110' }, { date: 'Dec 12, 2025', desc: 'Tire rotation', cost: '$60' }] },
]

const categories = [
  { key: 'all', emoji: '🚗', name: 'All' },
  { key: 'standard', emoji: '🚗', name: 'Standard' },
  { key: 'suv', emoji: '🚙', name: 'SUV' },
  { key: 'vip-suv', emoji: '⭐', name: 'VIP SUV' },
  { key: 'luxury', emoji: '👑', name: 'Luxury' },
  { key: 'van', emoji: '🚐', name: 'Van' },
]

const catColors: Record<string, string> = {
  standard: 'var(--border)',
  suv: 'var(--info-soft)',
  'vip-suv': 'var(--gold-soft)',
  luxury: 'var(--gold-soft)',
  van: 'var(--border)',
}

const catTextColors: Record<string, string> = {
  standard: 'var(--fg-muted)',
  suv: 'var(--info)',
  'vip-suv': 'var(--gold)',
  luxury: 'var(--gold)',
  van: 'var(--fg-muted)',
}

const statusEmoji: Record<string, string> = {
  available: '✅',
  in_service: '🔄',
  maintenance: '🔧',
  offline: '⏸️',
}

export default function FleetPage() {
  const { t } = useI18n();
  const d = (t.admin as any).fleet ?? {};
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return allVehicles.filter(v => {
      if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!v.name.toLowerCase().includes(q) && !v.plate.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedCategory, search]);

  const kpi = useMemo(() => ({
    total: allVehicles.length,
    available: allVehicles.filter(v => v.status === 'available').length,
    inService: allVehicles.filter(v => v.status === 'in_service').length,
    maintenance: allVehicles.filter(v => v.status === 'maintenance').length,
    offline: allVehicles.filter(v => v.status === 'offline').length,
  }), []);

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'available': return 'badge badge-accent';
      case 'in_service': return 'badge badge-info';
      case 'maintenance': return 'badge badge-warning';
      default: return 'badge';
    }
  }

  const kpiIcons = {
    total: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2"/><circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/></svg>`,
    available: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="20 6 9 17 4 12"/></svg>`,
    inService: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    maintenance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    offline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  }

  return (
    <div className="fleet-page">
      {/* ── KPI ROW ── */}
      <div>
        <div className="section-title">
          Fleet Overview
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--fg-muted)' }}>Updated 5 min ago</span>
        </div>
        <div className="kpi-fleet-grid">
          {[
            { label: d.kpiTotal || 'Total Vehicles', value: kpi.total, sub: 'Entire fleet', icon: kpiIcons.total, iconClass: 'green' },
            { label: d.kpiAvailable || 'Available', value: kpi.available, sub: '+2 vs yesterday', icon: kpiIcons.available, iconClass: 'green', up: true },
            { label: d.kpiInService || 'In Service', value: kpi.inService, sub: '4 VIP transfers', icon: kpiIcons.inService, iconClass: 'blue' },
            { label: d.kpiMaintenance || 'Under Maintenance', value: kpi.maintenance, sub: 'Est. return this week', icon: kpiIcons.maintenance, iconClass: 'amber' },
            { label: d.kpiOffline || 'Offline', value: kpi.offline, sub: 'Pending inspection', icon: kpiIcons.offline, iconClass: 'gray' },
          ].map((card, idx) => (
            <div key={idx} className="kpi-fleet-card">
              <div className="kpi-top">
                <div className={`kpi-icon ${card.iconClass}`} dangerouslySetInnerHTML={{ __html: card.icon }} />
              </div>
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-value">{card.value}</div>
              <div className={`kpi-sub${card.up ? ' up' : ''}`} style={{ color: card.up ? 'var(--accent)' : 'var(--fg-muted)' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VEHICLE CATEGORIES ── */}
      <div>
        <div className="section-title">Vehicle Categories</div>
        <div className="category-grid">
          {categories.map(cat => {
            const count = cat.key === 'all' ? allVehicles.length : allVehicles.filter(v => v.category === cat.key).length;
            return (
              <div
                key={cat.key}
                className={`category-card ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                <span className="category-emoji">{cat.emoji}</span>
                <div className="category-name">{cat.name}</div>
                <div className="category-count">{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── VEHICLE CARDS ── */}
      <div>
        <div className="section-title">
          All Vehicles
          <div className="dp-search-bar" style={{ margin: 0, marginLeft: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder={d.searchPlaceholder || 'Search vehicles...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
        <div className="vehicle-grid">
          {filtered.length === 0 ? (
            <div className="text-fg-muted text-center py-12" style={{ gridColumn: '1 / -1' }}>{d.noResults || 'No vehicles found'}</div>
          ) : filtered.map(v => (
            <div
              key={v.id}
              className="vehicle-card"
              onClick={() => setSelectedVehicle(v)}
            >
              <div className="vehicle-image">{statusEmoji[v.status] || '🚗'}</div>
              <div className="vehicle-name">{v.name}</div>
              <div className="vehicle-plate">{v.plate}</div>
              <div className="vehicle-meta">
                <span className="badge" style={{ fontSize: 9, background: catColors[v.category] || 'var(--border)', color: catTextColors[v.category] || 'var(--fg-muted)' }}>
                  {v.category === 'vip-suv' ? 'VIP SUV' : v.category.charAt(0).toUpperCase() + v.category.slice(1)}
                </span>
                <span className={getBadgeClass(v.status)} style={{ fontSize: 9 }}>
                  {v.status === 'in_service' ? 'In Service' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
              </div>
              <div className="vehicle-footer">
                <div className="vehicle-driver">
                  {v.driver ? (
                    <>
                      <span className="av">{v.driverInit}</span>
                      <span>{v.driver}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--fg-muted)' }}>Unassigned</span>
                  )}
                </div>
                <div>
                  <span className={`health-dot ${v.soatOk ? 'ok' : 'bad'}`} style={{ marginRight: 3 }}></span>
                  SOAT · <span className={`health-dot ${v.inspOk ? 'ok' : 'bad'}`} style={{ marginRight: 3 }}></span>
                  Insp
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAINTENANCE SCHEDULE ── */}
      <div>
        <div className="section-title">Maintenance Schedule</div>
        <div className="maintenance-grid">
          {[
            { vehicle: 'Toyota Hilux', plate: 'MDE-223', task: 'Oil change & inspection', date: 'May 28, 2026', priority: 'high', assignee: 'Taller MDE' },
            { vehicle: 'BMW X5', plate: 'MDE-511', task: 'Brake pad replacement', date: 'Jun 2, 2026', priority: 'medium', assignee: 'Bavaria Motors' },
            { vehicle: 'Chevrolet Traverse', plate: 'MDE-334', task: 'Tire rotation & alignment', date: 'Jun 5, 2026', priority: 'low', assignee: 'In-house' },
          ].map((item, idx) => (
            <div key={idx} className="maintenance-card">
              <div className="maint-vehicle">{item.vehicle}</div>
              <div className="maint-plate">{item.plate}</div>
              <div className="maint-task">{item.task}</div>
              <div className="maint-meta">
                <span className={`badge ${item.priority === 'high' ? 'badge-warning' : item.priority === 'medium' ? 'badge-info' : 'badge'}`}>
                  {item.priority}
                </span>
                <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>{item.date}</span>
              </div>
              <div className="maint-assignee">{item.assignee}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FLEET ANALYTICS ── */}
      <div>
        <div className="section-title">Fleet Analytics</div>
        <div className="fleet-analytics">
          <div className="analytics-card">
            <div className="card-header"><span className="card-title">Fuel Consumption</span></div>
            <div className="card-body">
              <div className="fuel-bar">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => (
                  <div key={day} className="fuel-bar-col">
                    <div className={`bar ${i < 5 ? 'accent' : 'muted'}`} style={{ height: `${40 + Math.abs(Math.sin(i * 0.8)) * 50 + 10}%` }} />
                    <span className="bar-label">{day.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="card-header"><span className="card-title">Fleet Utilization</span></div>
            <div className="card-body">
              <div className="util-number">78%</div>
              <div className="util-label">Active fleet rate</div>
              <div className="util-gauge">
                <div className="ring">78</div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>12 of 15 vehicles</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>in service today</div>
                </div>
              </div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="card-header"><span className="card-title">Key Metrics</span></div>
            <div className="card-body">
              <div className="metric-item"><span className="label">Avg. trip duration</span><span className="value">42 min</span></div>
              <div className="metric-item"><span className="label">Revenue per vehicle</span><span className="value">$2,840</span></div>
              <div className="metric-item"><span className="label">Maintenance cost</span><span className="value">$12.5k</span></div>
              <div className="metric-item"><span className="label">Driver utilization</span><span className="value">86%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VEHICLE DETAIL MODAL ── */}
      {selectedVehicle && (
        <div className="modal-overlay open" onClick={() => setSelectedVehicle(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selectedVehicle.name}</span>
              <button className="icon-btn" onClick={() => setSelectedVehicle(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Vehicle Detail Header */}
              <div className="vehicle-detail-header">
                <div className="vehicle-detail-image">{selectedVehicle.emoji}</div>
                <div className="vehicle-detail-info">
                  <h3>{selectedVehicle.name}</h3>
                  <div className="plate">{selectedVehicle.plate}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className={getBadgeClass(selectedVehicle.status)}>
                      {selectedVehicle.status === 'in_service' ? 'In Service' : selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                    </span>
                    <span className="badge badge-gold">{selectedVehicle.category}</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Driver', value: selectedVehicle.driver || 'Unassigned' },
                  { label: 'Year', value: selectedVehicle.year },
                  { label: 'Capacity', value: selectedVehicle.capacity },
                  { label: 'Trips', value: selectedVehicle.trips },
                  { label: 'Distance', value: `${selectedVehicle.km.toLocaleString()} km` },
                  { label: 'Revenue', value: `$${selectedVehicle.revenue.toLocaleString()}` },
                  { label: 'Next Service', value: selectedVehicle.nextService },
                ].map(f => (
                  <div key={f.label} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500, marginTop: 2 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--fg-muted)', marginBottom: 8 }}>Documents & Compliance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {selectedVehicle.documents.map((doc, i) => {
                  const docIcon = doc.state === 'ok' ? '✅' : doc.state === 'warn' ? '⚠️' : '❌'
                  const cls = doc.state === 'ok' ? 'green' : doc.state === 'warn' ? 'amber' : 'blue'
                  return (
                    <div key={i} className="detail-doc">
                      <div className={`detail-doc-icon ${cls}`}>{docIcon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{doc.status}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Driver History */}
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--fg-muted)', marginBottom: 8 }}>Driver History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                {selectedVehicle.driverHistory.map((dh, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                    <span style={{ color: 'var(--fg)', fontWeight: 500 }}>{dh.name}</span>
                    <span style={{ color: 'var(--fg-muted)' }}>{dh.period}</span>
                  </div>
                ))}
              </div>

              {/* Maintenance Log */}
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--fg-muted)', marginBottom: 8 }}>Maintenance Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {selectedVehicle.maintenanceLog.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--fg)', fontWeight: 500 }}>{m.desc}</span>
                      <span style={{ color: 'var(--fg-muted)', marginLeft: 8 }}>{m.date}</span>
                    </div>
                    <span style={{ color: 'var(--fg-secondary)', fontWeight: 500 }}>{m.cost}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedVehicle(null)}>{d.close || 'Close'}</button>
              <button className="btn btn-primary">Edit Vehicle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}