'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';

interface InventoryItem {
  id: number; name: string; category: string; stock: number; usagePerWeek: number
  supplier: string; supplierType: 'express' | 'standard'; supplierLead: string
  status: 'ok' | 'low' | 'reorder'
}

const items: InventoryItem[] = [
  { id: 1, name: 'Premium Welcome Kit', category: 'Welcome Kits', stock: 156, usagePerWeek: 12, supplier: 'Express Supplies', supplierType: 'express', supplierLead: '3d', status: 'ok' },
  { id: 2, name: 'Claro 5GB SIM', category: 'SIM Cards', stock: 200, usagePerWeek: 18, supplier: 'Claro Colombia', supplierType: 'express', supplierLead: '2d', status: 'ok' },
  { id: 3, name: 'Tigo 10GB SIM', category: 'SIM Cards', stock: 142, usagePerWeek: 10, supplier: 'Tigo Colombia', supplierType: 'express', supplierLead: '2d', status: 'ok' },
  { id: 4, name: 'Colombian Coffee Set', category: 'Tourist Gifts', stock: 45, usagePerWeek: 5, supplier: 'Café del Sur', supplierType: 'standard', supplierLead: '5d', status: 'ok' },
  { id: 5, name: 'Handicraft Keychain', category: 'Tourist Gifts', stock: 44, usagePerWeek: 3, supplier: 'Artesanos MDE', supplierType: 'standard', supplierLead: '7d', status: 'low' },
  { id: 6, name: 'Branded Brochure', category: 'Promo Materials', stock: 23, usagePerWeek: 8, supplier: 'PrintPro MDE', supplierType: 'express', supplierLead: '4d', status: 'reorder' },
  { id: 7, name: 'City Map Guide', category: 'Promo Materials', stock: 18, usagePerWeek: 7, supplier: 'PrintPro MDE', supplierType: 'express', supplierLead: '4d', status: 'reorder' },
]

const statusBadges: Record<string, string> = {
  ok: 'badge badge-accent',
  low: 'badge badge-warning',
  reorder: 'badge badge-danger',
}

const statusLabels: Record<string, string> = {
  ok: 'OK',
  low: 'Low',
  reorder: 'Reorder',
}

export default function InventoryPage() {
  const { t } = useI18n();
  const d = (t.admin as any).inventory ?? {};
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [toast, setToast] = useState<string | null>(null);
  const [restockModal, setRestockModal] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    if (selectedCategory === 'All Categories') return items;
    return items.filter(i => i.category === selectedCategory);
  }, [selectedCategory]);

  const categories = useMemo(() => ['All Categories', ...new Set(items.map(i => i.category))], []);

  const categories2 = useMemo(() => {
    const map: Record<string, { total: number; used: number; color: string }> = {
      'Welcome Kits': { total: 156, used: 12, color: 'var(--accent)' },
      'SIM Cards': { total: 342, used: 28, color: 'var(--info)' },
      'Tourist Gifts': { total: 89, used: 8, color: 'var(--gold)' },
      'Promo Materials': { total: 41, used: 15, color: 'var(--danger)' },
    }
    return map;
  }, []);

  const lowItems = useMemo(() => items.filter(i => i.status !== 'ok'), []);

  return (
    <div className="inv-page">
      <section className="inv-hero">
        <div>
          <h1>{d.title || 'Inventory'}</h1>
          <p>{d.subtitle || 'Stock and supplier management'}</p>
        </div>
        <div className="inv-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setRestockModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Restock
          </button>
        </div>
      </section>

      {/* Restock Alerts */}
      {lowItems.length > 0 && (
        <div className="restock-banner danger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span><strong>{lowItems.length} items critically low:</strong> {lowItems.map(i => `${i.name} (${i.stock})`).join(', ')}</span>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', border: 'none' }} onClick={() => setRestockModal(true)}>
            Restock Now
          </button>
        </div>
      )}

      {/* Stock Overview Cards */}
      <div className="inv-grid">
        {Object.entries(categories2).map(([name, data]) => {
          const pct = Math.min(Math.round((data.used / data.total) * 100), 100);
          const isLow = data.color === 'var(--danger)';
          return (
            <div key={name} className="inv-card" style={isLow ? { borderColor: 'var(--danger)' } : {}}>
              <div className="inv-card-icon" style={{ background: data.color === 'var(--accent)' ? 'var(--accent-soft)' : data.color === 'var(--info)' ? 'var(--info-soft)' : data.color === 'var(--gold)' ? 'var(--gold-soft)' : 'var(--danger-soft)', color: data.color }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <h4>{name}</h4>
              <div className="stock" style={isLow ? { color: 'var(--danger)' } : {}}>{data.total}</div>
              <div className="stock-label">{isLow ? '⚠️ Low stock' : `${data.used} used this week`}</div>
              <div className="usage-bar">
                <div className="usage-bar-fill" style={{ width: `${pct}%`, background: data.color }}></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Items</span>
            <div className="table-controls">
              <select
                className="input"
                style={{ width: 'auto', padding: '5px 10px', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', outline: 'none' }}
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th><th>Category</th><th>Stock</th><th>Usage/Week</th><th>Supplier</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-fg-muted">{d.noResults || 'No items found'}</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-surface-hover transition-colors">
                    <td><span style={{ fontWeight: 500 }}>{item.name}</span></td>
                    <td>{item.category}</td>
                    <td>{item.stock}</td>
                    <td>{item.usagePerWeek}</td>
                    <td>
                      <span className={`supplier-badge ${item.supplierType}`}>
                        📦 {item.supplier} · {item.supplierLead}
                      </span>
                    </td>
                    <td><span className={statusBadges[item.status]}>{statusLabels[item.status]}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Edit ${item.name}`)}>
                        {d.edit || 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Restock Suggestions */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Restock Suggestions</span>
              <span className="badge badge-danger">{lowItems.length} needs action</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {lowItems.length === 0 ? (
                <p className="text-fg-muted text-center py-6">{d.noAlerts || 'All items well stocked'}</p>
              ) : lowItems.map(item => (
                <div key={item.id} className="restock-suggest">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: item.status === 'reorder' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }}>
                    {item.status === 'reorder' ? (
                      <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                    ) : (
                      <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>
                    )}
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                      Stock: {item.stock} · {item.usagePerWeek}/week · Order from {item.supplier}
                    </div>
                  </div>
                  <button
                    className={`btn btn-sm ${item.status === 'reorder' ? 'btn-primary' : 'btn-warning'}`}
                    onClick={() => showToast(`Restock ordered: ${item.name}`)}
                  >
                    Order
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">{d.recentActivity || 'Recent Activity'}</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="inv-history-item">
                <div className="inv-direction inv-in">+</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>Restocked Welcome Kits</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>+50 units · 2h ago</div></div>
              </div>
              <div className="inv-history-item">
                <div className="inv-direction inv-out">−</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>SIM assigned to booking #1245</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>1 unit · 4h ago</div></div>
              </div>
              <div className="inv-history-item">
                <div className="inv-direction inv-out">−</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>Welcome Kit — VIP Guest</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>1 unit · Yesterday</div></div>
              </div>
              <div className="inv-history-item">
                <div className="inv-direction inv-in">+</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>New SIM shipment arrived</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>+100 units · Yesterday</div></div>
              </div>
              <div className="inv-history-item">
                <div className="inv-direction inv-out">−</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>Gift bag — James R.</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>1 unit · Yesterday</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setRestockModal(false) }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{d.modalTitle || 'Restock Inventory'}</h2>
              <button className="close-btn" onClick={() => setRestockModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{d.itemLabel || 'Item'}</label>
                <select className="input">
                  {items.map(i => <option key={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{d.quantityLabel || 'Quantity'}</label>
                <input className="input" type="number" defaultValue={100} min={1} />
              </div>
              <div className="form-group">
                <label>{d.supplierLabel || 'Supplier'}</label>
                <input className="input" value="PrintPro MDE" readOnly style={{ color: 'var(--fg-muted)' }} />
              </div>
              <div className="form-group">
                <label>{d.deliveryLabel || 'Estimated delivery'}</label>
                <input className="input" value="4 business days" readOnly style={{ color: 'var(--fg-muted)' }} />
              </div>
              <div className="form-group">
                <label>{d.notesLabel || 'Notes'}</label>
                <textarea className="input" rows={3} placeholder="Order notes..." style={{ resize: 'vertical' }}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRestockModal(false)}>{d.cancel || 'Cancel'}</button>
              <button className="btn btn-primary" onClick={() => { setRestockModal(false); showToast(d.restockPlaced || 'Restock ordered') }}>{d.placeOrder || 'Place Order'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="toast-stack">
        {toast && <div className="toast visible">{toast}</div>}
      </div>
    </div>
  );
}