'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

export default function PromotionsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).promotions ?? {}
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* ── Promo Grid ── */}
      <div className="promo-grid">
        <div className="promo-card-lg">
          <div className="label">Active Campaign</div>
          <div className="big">Summer 2026</div>
          <div className="desc">20% off all airport transfers and city tours. Use code <strong>SUMMER20</strong></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setShowModal(true)}>
              {d.editCampaign || 'Edit Campaign'}
            </button>
            <button className="btn btn-secondary btn-sm" style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              {d.viewReport || 'View Report'}
            </button>
          </div>
        </div>
        <div className="promo-stat">
          <div className="val" style={{ color: 'var(--accent)' }}>$12,450</div>
          <div className="lbl">{d.revenueGenerated || 'Revenue Generated'}</div>
        </div>
        <div className="promo-stat">
          <div className="val" style={{ color: 'var(--info)' }}>234</div>
          <div className="lbl">{d.redemptions || 'Total Redemptions'}</div>
        </div>
      </div>

      {/* ── Loyalty Tiers ── */}
      <div>
        <div className="section-title">Loyalty Program — Tiers</div>
        <div className="loyalty-grid">
          <div className="loyalty-card gold">
            <div className="tier-icon">🥇</div>
            <div className="tier-name">{d.gold || 'Gold'}</div>
            <div className="tier-count">145</div>
            <div className="tier-desc">{d.goldDesc || '3+ trips this year · 5% discount'}</div>
          </div>
          <div className="loyalty-card platinum">
            <div className="tier-icon">💎</div>
            <div className="tier-name">{d.platinum || 'Platinum'}</div>
            <div className="tier-count">78</div>
            <div className="tier-desc">{d.platinumDesc || '8+ trips this year · 10% discount · Priority support'}</div>
          </div>
          <div className="loyalty-card elite">
            <div className="tier-icon">👑</div>
            <div className="tier-name">{d.elite || 'Elite'}</div>
            <div className="tier-count">23</div>
            <div className="tier-desc">{d.eliteDesc || '15+ trips this year · 15% discount · VIP treatment'}</div>
          </div>
        </div>
      </div>

      {/* ── Campaigns ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="section-title" style={{ marginBottom: 0 }}>{d.campaigns || 'Campaigns'}</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {d.newCampaign || 'New Campaign'}
          </button>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Summer Sale 2026', meta: 'June 1 – Aug 31 · 20% off', icon: '☀️', bg: 'var(--accent-soft)', stats: '1,240 bookings · $12.4K rev' },
            { name: 'VIP Experience', meta: 'Year-round · 15% off premium', icon: '⭐', bg: 'var(--gold-soft)', stats: '312 bookings · $8.2K rev' },
            { name: 'Flash Friday', meta: 'Every Friday · 50% off limited', icon: '⚡', bg: 'var(--warning-soft)', stats: '89 bookings · $3.1K rev' },
            { name: 'Referral Rewards', meta: 'Ongoing · $20 per referral', icon: '🤝', bg: 'var(--info-soft)', stats: '67 referrals · $1.3K rev' },
          ].map((c, idx) => (
            <div key={idx} className="campaign-card">
              <div className="campaign-icon" style={{ background: c.bg }}>{c.icon}</div>
              <div className="campaign-info">
                <div className="campaign-name">{c.name}</div>
                <div className="campaign-meta">{c.meta}</div>
                <div className="campaign-stats"><span>{c.stats}</span></div>
              </div>
              <button className="btn btn-ghost btn-sm">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── New Campaign Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-[480px] rounded-[14px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-[15px] font-semibold">{d.newCampaign || 'New Campaign'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-[4px]" style={{ color: 'var(--fg-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="form-group">
                <label className="input-label">{d.campaignName || 'Campaign Name'}</label>
                <input className="input" placeholder="e.g. Summer Sale" />
              </div>
              <div className="form-group">
                <label className="input-label">{d.discountType || 'Discount Type'}</label>
                <select className="input" style={{ appearance: 'auto' }}>
                  <option>{d.percentage || 'Percentage (%)'}</option>
                  <option>{d.fixedAmount || 'Fixed Amount ($)'}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="input-label">{d.discountValue || 'Discount Value'}</label>
                  <input className="input" type="number" placeholder="20" />
                </div>
                <div className="form-group">
                  <label className="input-label">{d.maxRedemptions || 'Max Redemptions'}</label>
                  <input className="input" type="number" placeholder="1000" />
                </div>
              </div>
              <div className="code-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="input-label">{d.promoCode || 'Promo Code'}</label>
                  <input className="input" placeholder="SUMMER20" />
                </div>
                <div className="form-group" style={{ flex: 0 }}>
                  <label className="input-label">&nbsp;</label>
                  <button className="btn btn-secondary btn-sm" style={{ height: 38 }}>{d.generate || 'Generate'}</button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn btn-primary flex-1">{d.createCampaign || 'Create Campaign'}</button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{d.cancel || 'Cancel'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}