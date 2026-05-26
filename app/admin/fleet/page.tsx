'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';

interface Vehicle {
  id: number; name: string; plate: string; category: string; status: string
  driver: string | null; driverInit: string | null; soatOk: boolean; inspOk: boolean
  year: string; capacity: string
}

const allVehicles: Vehicle[] = [
  { id: 1, name: 'Mercedes V-Class', plate: 'MDE-782', category: 'vip-suv', status: 'available', driver: 'Carlos M.', driverInit: 'CM', soatOk: true, inspOk: true, year: '2024', capacity: '7 pax' },
  { id: 2, name: 'BMW X5', plate: 'MDE-511', category: 'suv', status: 'in_service', driver: 'María G.', driverInit: 'MG', soatOk: true, inspOk: false, year: '2023', capacity: '5 pax' },
  { id: 3, name: 'Mercedes S-Class', plate: 'VIP-001', category: 'luxury', status: 'available', driver: 'Felipe L.', driverInit: 'FL', soatOk: true, inspOk: true, year: '2025', capacity: '4 pax' },
  { id: 4, name: 'Toyota Hilux', plate: 'MDE-223', category: 'standard', status: 'maintenance', driver: null, driverInit: null, soatOk: true, inspOk: false, year: '2022', capacity: '5 pax' },
  { id: 5, name: 'Chevrolet Traverse', plate: 'MDE-334', category: 'suv', status: 'available', driver: 'Diego P.', driverInit: 'DP', soatOk: true, inspOk: true, year: '2023', capacity: '7 pax' },
  { id: 6, name: 'Porsche Cayenne', plate: 'MDE-890', category: 'luxury', status: 'available', driver: 'Laura C.', driverInit: 'LC', soatOk: true, inspOk: true, year: '2024', capacity: '5 pax' },
  { id: 7, name: 'Toyota Hiace', plate: 'MDE-567', category: 'van', status: 'in_service', driver: 'Pedro A.', driverInit: 'PA', soatOk: true, inspOk: true, year: '2023', capacity: '14 pax' },
  { id: 8, name: 'Nissan Pathfinder', plate: 'MDE-678', category: 'suv', status: 'available', driver: null, driverInit: null, soatOk: true, inspOk: true, year: '2024', capacity: '7 pax' },
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" onClick={() => setSelectedVehicle(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[520px] rounded-[14px] overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{selectedVehicle.name}</h3>
              <button onClick={() => setSelectedVehicle(null)} className="p-1.5 rounded-[4px] transition-all" style={{ color: 'var(--fg-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-[100px] h-[80px] rounded-[8px] flex items-center justify-center text-[28px] flex-shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                  {statusEmoji[selectedVehicle.status] || '🚗'}
                </div>
                <div className="flex-1">
                  <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>{selectedVehicle.name}</h3>
                  <div className="text-[13px] font-mono" style={{ color: 'var(--fg-muted)' }}>{selectedVehicle.plate}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className={getBadgeClass(selectedVehicle.status)}>
                      {selectedVehicle.status === 'in_service' ? 'In Service' : selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                    </span>
                    <span className="badge badge-gold">{selectedVehicle.category}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Driver</label>
                  <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedVehicle.driver || 'Unassigned'}</div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Year</label>
                  <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedVehicle.year}</div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Capacity</label>
                  <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedVehicle.capacity}</div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Plate</label>
                  <div className="text-[13px] font-mono" style={{ color: 'var(--fg)' }}>{selectedVehicle.plate}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setSelectedVehicle(null)} className="btn btn-secondary w-full">{d.close || 'Close'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}