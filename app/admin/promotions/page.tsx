'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

export default function PromotionsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).promotions ?? {}
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="promo-page">
      <section className="promo-hero">
        <div>
          <h1>{d.title || 'Promotions & Referrals'}</h1>
          <p>{d.subtitle || 'Manage campaigns, referrals, and loyalty rewards.'}</p>
        </div>
        <div className="promo-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {d.newCampaign || 'New Campaign'}
          </button>
        </div>
      </section>

      {/* ── Overview Stats ── */}
      <div className="promo-grid">
        <div className="promo-card-lg">
          <div className="label">{d.totalReferrals || 'Total Referrals'}</div>
          <div className="big">847</div>
          <div className="desc">+124 this month · 32% conversion rate</div>
        </div>
        <div className="promo-stat">
          <div className="val" style={{ color: 'var(--accent)' }}>32%</div>
          <div className="lbl">{d.conversionRate || 'Conversion Rate'}</div>
        </div>
        <div className="promo-stat">
          <div className="val" style={{ color: 'var(--info)' }}>5</div>
          <div className="lbl">{d.activeCampaigns || 'Active Campaigns'}</div>
        </div>
        <div className="promo-stat">
          <div className="val" style={{ color: 'var(--gold)' }}>214</div>
          <div className="lbl">{d.returningCustomers || 'Returning Customers'}</div>
        </div>
        <div className="promo-stat">
          <div className="val" style={{ color: 'var(--accent)' }}>$12.4k</div>
          <div className="lbl">{d.revenueFromReferrals || 'Revenue from Referrals'}</div>
        </div>
      </div>

      {/* ── Loyalty Tiers ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>{d.loyaltyTitle || 'Loyalty Program'}</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => showToast('Loyalty settings opened')}>{d.manageTiers || 'Manage Tiers'}</button>
      </div>
      <div className="loyalty-grid">
        <div className="loyalty-card gold">
          <div className="tier-icon">🥇</div>
          <div className="tier-name">{d.gold || 'Gold'}</div>
          <div className="tier-count" style={{ color: 'var(--gold)' }}>128</div>
          <div className="tier-desc">{d.goldDesc || '5+ trips · 10% discount · Priority support'}</div>
        </div>
        <div className="loyalty-card platinum">
          <div className="tier-icon">💎</div>
          <div className="tier-name">{d.platinum || 'Platinum'}</div>
          <div className="tier-count" style={{ color: 'var(--accent)' }}>64</div>
          <div className="tier-desc">{d.platinumDesc || '15+ trips · 20% discount · Free upgrades'}</div>
        </div>
        <div className="loyalty-card elite">
          <div className="tier-icon">👑</div>
          <div className="tier-name">{d.elite || 'Elite'}</div>
          <div className="tier-count" style={{ color: 'var(--info)' }}>22</div>
          <div className="tier-desc">{d.eliteDesc || '30+ trips · 30% discount · Personal concierge'}</div>
        </div>
      </div>

      {/* ── Generate Referral Code ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">{d.generateCode || 'Generate Referral Code'}</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>{d.discountPercent || 'Discount (%)'}</label>
              <input className="input" type="number" defaultValue={15} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>{d.minTripValue || 'Min. trip value'}</label>
              <input className="input" type="text" defaultValue="$50" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>{d.expiresIn || 'Expires in'}</label>
              <select className="input" defaultValue="30 days">
                <option>7 days</option>
                <option>30 days</option>
                <option>60 days</option>
                <option>90 days</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ marginBottom: 1 }} onClick={() => showToast('Referral code generated')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {d.generate || 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Campaigns ── */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{d.campaigns || 'Active Campaigns'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { name: 'Welcome Bonus', meta: '15% off first airport transfer', icon: '🎉', bg: 'var(--accent-soft)', badge: 'Active', badgeCls: 'badge badge-accent', stats: '🎯 234 redemptions · 📈 8.2% conv. · 💰 $3.2k rev.' },
          { name: 'VIP Referral Program', meta: '$20 credit per referral', icon: '⭐', bg: 'var(--gold-soft)', badge: 'Active', badgeCls: 'badge badge-accent', stats: '🎯 87 this month · 📈 12.4% conv. · 💰 $5.1k rev.' },
          { name: 'Returning Customer', meta: '10% off on 3rd booking', icon: '🔄', bg: 'var(--info-soft)', badge: 'Active', badgeCls: 'badge badge-accent', stats: '🎯 214 enrolled · 📈 6.8% conv. · 💰 $4.1k rev.' },
          { name: 'Summer Medellín', meta: '20% off Guatapé tours', icon: '📅', bg: 'var(--warning-soft)', badge: 'Scheduled', badgeCls: 'badge badge-warning', stats: '📅 Starts Jun 1 · 🎯 0 redemptions' },
        ].map((c, idx) => (
          <div key={idx} className="campaign-card">
            <div className="campaign-icon" style={{ background: c.bg }}>{c.icon}</div>
            <div className="campaign-info">
              <div className="campaign-name">{c.name}</div>
              <div className="campaign-meta">{c.meta}</div>
              <div className="campaign-stats"><span>{c.stats}</span></div>
            </div>
            <span className={c.badgeCls}>{c.badge}</span>
          </div>
        ))}
      </div>

      {/* ── Referral Source Breakdown + History ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{d.referralSources || 'Referral Sources'}</span>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {[
              { label: 'WhatsApp Share', pct: 85, value: '42%', color: 'var(--accent)' },
              { label: 'Email Invite', pct: 55, value: '28%', color: 'var(--info)' },
              { label: 'In-App Share', pct: 35, value: '18%', color: 'var(--gold)' },
              { label: 'SMS Campaign', pct: 24, value: '12%', color: 'var(--warning)' },
            ].map((s, i) => (
              <div key={i} className="referral-source-item">
                <span>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="referral-source-bar"><div className="fill" style={{ width: `${s.pct}%`, background: s.color }}></div></div>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{d.recentReferrals || 'Recent Referrals'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => showToast('Download report')}>{d.export || 'Export'}</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{d.referrer || 'Referrer'}</th><th>{d.referred || 'Referred'}</th><th>{d.source || 'Source'}</th><th>{d.codeUsed || 'Code Used'}</th><th>{d.date || 'Date'}</th><th>{d.status || 'Status'}</th><th>{d.reward || 'Reward'}</th></tr>
              </thead>
              <tbody>
                {[
                  ['James Rodriguez', 'Sarah Johnson', 'WhatsApp', 'MED-JR-15', 'Today', 'badge badge-accent', 'Completed', '$20'],
                  ['Ana López', 'Mark Taylor', 'Email', 'MED-AL-10', 'Yesterday', 'badge badge-accent', 'Completed', '$20'],
                  ['Carlos Gómez', 'Lisa Wang', 'In-App', 'MED-CG-15', '2 days ago', 'badge badge-warning', 'Pending', '$20'],
                  ['Sofía Martínez', 'David Chen', 'WhatsApp', 'MED-SM-20', '3 days ago', 'badge badge-accent', 'Completed', '$20'],
                  ['Elena Restrepo', 'John Smith', 'SMS', 'MED-ER-10', '5 days ago', 'badge badge-accent', 'Completed', '$20'],
                ].map((r, i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 500 }}>{r[0]}</span></td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r[3]}</td>
                    <td>{r[4]}</td>
                    <td><span className={r[5]}>{r[6]}</span></td>
                    <td>{r[7]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── New Campaign Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{d.newCampaign || 'New Campaign'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{d.campaignName || 'Campaign name'}</label>
                <input className="input" placeholder="e.g. Holiday Special" />
              </div>
              <div className="form-group">
                <label>{d.discountType || 'Discount type'}</label>
                <select className="input">
                  <option>{d.percentage || 'Percentage (%)'}</option>
                  <option>{d.fixedAmount || 'Fixed amount ($)'}</option>
                  <option>Free service</option>
                </select>
              </div>
              <div className="form-group">
                <label>{d.discountValue || 'Discount value'}</label>
                <input className="input" type="number" placeholder="e.g. 20" />
              </div>
              <div className="form-group">
                <label>{d.targetAudience || 'Target audience'}</label>
                <select className="input">
                  <option>{d.allCustomers || 'All customers'}</option>
                  <option>{d.firstTime || 'First-time only'}</option>
                  <option>{d.returning || 'Returning customers'}</option>
                  <option>{d.vipOnly || 'VIP only'}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{d.tierTarget || 'Target tier'}</label>
                <select className="input">
                  <option>{d.allTiers || 'All tiers'}</option>
                  <option>Gold+</option>
                  <option>Platinum+</option>
                  <option>Elite only</option>
                </select>
              </div>
              <div className="form-group">
                <label>{d.validUntil || 'Valid until'}</label>
                <input className="input" type="date" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{d.cancel || 'Cancel'}</button>
              <button className="btn btn-primary" onClick={() => { setShowModal(false); showToast('Campaign created') }}>{d.launch || 'Launch Campaign'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <div className="toast-stack">
        {toast && <div className="toast visible">{toast}</div>}
      </div>
    </div>
  )
}