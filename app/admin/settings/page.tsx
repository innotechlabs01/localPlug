'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/admin/toast-context'

const navItems = [
  { id: 'section-company', label: 'Company Information' },
  { id: 'section-pricing', label: 'Package Pricing' },
  { id: 'section-fees', label: 'Fees & Taxes' },
  { id: 'section-commissions', label: 'Commissions' },
  { id: 'section-business-rules', label: 'Business Rules' },
  { id: 'section-timeouts', label: 'Operational Timeouts' },
  { id: 'section-experiences', label: 'Experience Pricing' },
  { id: 'section-payments', label: 'Payment Integration' },
  { id: 'section-roles', label: 'User Roles' },
  { id: 'section-notifications', label: 'Notifications' },
  { id: 'section-regional', label: 'Language & Regional' },
]

export default function SettingsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).settings ?? {}
  const [activeSection, setActiveSection] = useState('section-company')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const { showToast } = useToast()

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // Fetch settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data = await res.json()
        setSettings(data)
      } catch (error) {
        console.error('Error fetching settings:', error)
        showToast('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Save settings to API
  const saveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      showToast('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Failed to save settings')
    }
  }

  const toggleSwitch = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const isOn = el.classList.toggle('on')
    // Update settings based on toggle - we need to identify which setting this is
    // For now, we'll show a toast and rely on manual save
    showToast(isOn ? 'Enabled' : 'Disabled')
  }

  const toggleCheck = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.classList.toggle('checked')
  }

  return (
    <div className="settings-layout">
      {/* ── Side Nav ── */}
      <nav className="settings-nav card" style={{ padding: 8, margin: 0 }}>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => scrollToSection(item.id)}
          >
            {item.label}
          </div>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="settings-content">

        {/* Section 1: Company Information */}
        <section className="settings-section" id="section-company">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="settings-section-title">{d.companyInfo || 'Company Information'}</span>
            <span className="settings-section-desc">{d.manageBusinessProfile || 'Manage your business profile'}</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
            <div className="input-group">
                 <label className="input-label">{d.companyName || 'Company Name'}</label>
                 <input className="input" type="text" 
                   value={settings.companyName ?? ''} 
                   onChange={(e) => setSettings(prev => ({...prev, companyName: e.target.value}))} 
                 />
               </div>
            <div className="input-group">
                 <label className="input-label">{d.legalName || 'Legal Name'}</label>
                 <input className="input" type="text" 
                   value={settings.legalName ?? ''} 
                   onChange={(e) => setSettings(prev => ({...prev, legalName: e.target.value}))} 
                 />
               </div>
              <div className="input-group">
                <label className="input-label">{d.taxId || 'NIT (Tax ID)'}</label>
                <input className="input" type="text" 
                  value={settings.taxId ?? ''} 
                  onChange={(e) => setSettings(prev => ({...prev, taxId: e.target.value}))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">{d.address || 'Address'}</label>
                <input className="input" type="text" 
                  value={settings.address ?? ''} 
                  onChange={(e) => setSettings(prev => ({...prev, address: e.target.value}))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">{d.phone || 'Phone'}</label>
                <input className="input" type="text" 
                  value={settings.phone ?? ''} 
                  onChange={(e) => setSettings(prev => ({...prev, phone: e.target.value}))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">{d.email || 'Email'}</label>
                <input className="input" type="email" 
                  value={settings.email ?? ''} 
                  onChange={(e) => setSettings(prev => ({...prev, email: e.target.value}))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">{d.website || 'Website'}</label>
                <input className="input" type="url" 
                  value={settings.website ?? ''} 
                  onChange={(e) => setSettings(prev => ({...prev, website: e.target.value}))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">{d.companyLogo || 'Company Logo'}</label>
                <div className="logo-upload" onClick={() => showToast(d.selectLogo || 'Select a logo image')}>
                  <div className="logo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{d.uploadLogo || 'Upload Logo'}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>PNG, JPG or WEBP · Max 2MB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Package Pricing */}
        <section className="settings-section" id="section-pricing">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span className="settings-section-title">Package Pricing</span>
            <span className="settings-section-desc">Configure service package prices in USD</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
              {[
                { key: 'pkg_smooth_landing_price', label: 'Smooth Landing', sub: 'The VIP Arrival', defaultVal: '89' },
                { key: 'pkg_first_24_price', label: 'First 24h Insider', sub: 'The 24h Insider', defaultVal: '159' },
                { key: 'pkg_full_insider_price', label: 'Full Insider Pass', sub: 'The Peace of Mind', defaultVal: '269' },
                { key: 'return_trip_charge', label: 'Return Trip Charge', sub: 'Round-trip add-on', defaultVal: '48' },
              ].map(item => (
                <div key={item.key} className="input-group">
                  <label className="input-label">
                    {item.label}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>$</span>
                    <input className="input" type="number" min="0" step="1"
                      value={settings[item.key] ?? item.defaultVal}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                      style={{ width: 120 }}
                    />
                    <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>USD</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--fg-secondary)' }}>
              <strong>Preview:</strong> First 24h (${settings['pkg_first_24_price'] || '159'}) + Return (${settings['return_trip_charge'] || '48'}) = <strong style={{ color: 'var(--accent-gold)' }}>${(Number(settings['pkg_first_24_price'] || 159) + Number(settings['return_trip_charge'] || 48)).toFixed(2)}</strong>
            </div>
          </div>
        </section>

        {/* Section: Fees & Taxes */}
        <section className="settings-section" id="section-fees">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span className="settings-section-title">Fees & Taxes</span>
            <span className="settings-section-desc">Configure service fees and tax rates</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
              {[
                { key: 'service_fee_flat', label: 'Service Fee (flat)', sub: 'Per-booking service charge', defaultVal: '5', prefix: '$', suffix: 'USD', step: '0.01' },
                { key: 'tax_rate_iva', label: 'IVA Tax Rate', sub: 'Colombian VAT (e.g. 0.19 = 19%)', defaultVal: '0.19', prefix: '', suffix: '', step: '0.01' },
                { key: 'stripe_fee_percent', label: 'Stripe Fee %', sub: 'Processing percentage', defaultVal: '0.029', prefix: '', suffix: '', step: '0.001' },
                { key: 'stripe_fee_fixed', label: 'Stripe Fee Fixed', sub: 'Per-transaction fixed fee', defaultVal: '0.30', prefix: '$', suffix: 'USD', step: '0.01' },
              ].map(item => (
                <div key={item.key} className="input-group">
                  <label className="input-label">
                    {item.label}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.prefix ? <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>{item.prefix}</span> : null}
                    <input className="input" type="number" min="0" step={item.step}
                      value={settings[item.key] ?? item.defaultVal}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                      style={{ width: 120 }}
                    />
                    {item.suffix ? <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Commissions */}
        <section className="settings-section" id="section-commissions">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
            <span className="settings-section-title">Commissions</span>
            <span className="settings-section-desc">Configure platform revenue shares</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
              {[
                { key: 'hotel_commission_rate', label: 'Hotel Commission', sub: 'Platform commission rate (e.g. 0.10 = 10%)', defaultVal: '0.10', step: '0.01' },
                { key: 'driver_commission_rate', label: 'Driver Commission', sub: 'Driver revenue share percentage', defaultVal: '30', suffix: '%', step: '1' },
                { key: 'hotel_revenue_per_night', label: 'Hotel Revenue/Night', sub: 'Avg revenue per night for reporting', defaultVal: '85', prefix: '$', suffix: 'USD', step: '1' },
              ].map(item => (
                <div key={item.key} className="input-group">
                  <label className="input-label">
                    {item.label}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.prefix ? <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>{item.prefix}</span> : null}
                    <input className="input" type="number" min="0" step={item.step}
                      value={settings[item.key] ?? item.defaultVal}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                      style={{ width: 120 }}
                    />
                    {item.suffix ? <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Business Rules */}
        <section className="settings-section" id="section-business-rules">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><path d="M6 10v2"/><path d="M18 10v2"/><path d="M6 18h4"/><path d="M14 18h4"/><path d="M6 14v4"/><path d="M18 14v4"/></svg>
            <span className="settings-section-title">Business Rules</span>
            <span className="settings-section-desc">Configure operational rules and limits</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
              {[
                { key: 'advance_booking_days', label: 'Advance Booking Days', sub: 'Minimum days before arrival', defaultVal: '10', suffix: 'days', step: '1' },
                { key: 'rate_limit_max_requests', label: 'Rate Limit Max', sub: 'Max requests per window', defaultVal: '20', suffix: 'req', step: '1' },
                { key: 'rate_limit_window_ms', label: 'Rate Limit Window', sub: 'Time window in milliseconds', defaultVal: '60000', suffix: 'ms', step: '1000' },
                { key: 'payment_intent_timeout_ms', label: 'Payment Timeout', sub: 'Stripe intent creation timeout', defaultVal: '60000', suffix: 'ms', step: '1000' },
                { key: 'payment_polling_interval_ms', label: 'Payment Poll Interval', sub: 'Status polling interval', defaultVal: '2000', suffix: 'ms', step: '500' },
                { key: 'payment_polling_max_attempts', label: 'Payment Max Polls', sub: 'Max status check attempts', defaultVal: '30', suffix: 'attempts', step: '1' },
              ].map(item => (
                <div key={item.key} className="input-group">
                  <label className="input-label">
                    {item.label}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="input" type="number" min="0" step={item.step}
                      value={settings[item.key] ?? item.defaultVal}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                      style={{ width: 140 }}
                    />
                    <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Operational Timeouts */}
        <section className="settings-section" id="section-timeouts">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="settings-section-title">Operational Timeouts</span>
            <span className="settings-section-desc">Configure system refresh and timeout intervals</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
              {[
                { key: 'admin_refresh_interval_ms', label: 'Admin Refresh', sub: 'Dashboard auto-refresh interval', defaultVal: '30000', suffix: 'ms', step: '5000' },
                { key: 'chat_connection_timeout_ms', label: 'Chat Connection', sub: 'Max connection wait time', defaultVal: '90000', suffix: 'ms', step: '5000' },
                { key: 'chat_reconnect_timeout_ms', label: 'Chat Reconnect', sub: 'Reconnection delay', defaultVal: '60000', suffix: 'ms', step: '5000' },
                { key: 'inactivity_timeout_ms', label: 'Inactivity Timeout', sub: 'Admin auto-logout timeout', defaultVal: '900000', suffix: 'ms', step: '30000' },
              ].map(item => (
                <div key={item.key} className="input-group">
                  <label className="input-label">
                    {item.label}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="input" type="number" min="0" step={item.step}
                      value={settings[item.key] ?? item.defaultVal}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                      style={{ width: 140 }}
                    />
                    <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Experience Pricing */}
        <section className="settings-section" id="section-experiences">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="settings-section-title">Experience Pricing</span>
            <span className="settings-section-desc">Configure tour and experience prices in USD</span>
          </div>
          <div className="settings-section-body">
            <div className="form-grid">
              {[
                { key: 'exp_guatape_price', label: 'Guatape & El Penol', sub: 'Full-day trip', defaultVal: '149' },
                { key: 'exp_comuna13_price', label: 'Comuna 13 Tour', sub: 'Guided neighborhood tour', defaultVal: '89' },
                { key: 'exp_coffee_price', label: 'Coffee Tour', sub: 'Coffee farm experience', defaultVal: '119' },
                { key: 'exp_paragliding_price', label: 'Paragliding', sub: 'Tandem flight', defaultVal: '79' },
                { key: 'exp_nightlife_price', label: 'Nightlife Experience', sub: 'VIP club access', defaultVal: '249' },
                { key: 'exp_vip_city_price', label: 'VIP City Experience', sub: 'Full concierge day', defaultVal: '399' },
              ].map(item => (
                <div key={item.key} className="input-group">
                  <label className="input-label">
                    {item.label}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>$</span>
                    <input className="input" type="number" min="0" step="1"
                      value={settings[item.key] ?? item.defaultVal}
                      onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                      style={{ width: 120 }}
                    />
                    <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>USD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Payment Integration */}
        <section className="settings-section" id="section-payments">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span className="settings-section-title">{d.paymentIntegration || 'Payment Integration'}</span>
            <span className="settings-section-desc">{d.stripeProcessing || 'Stripe payment processing'}</span>
          </div>
          <div className="settings-section-body">
            <div className="stripe-connect-card">
              <div className="stripe-status">
                <div className="stripe-status-dot" />
                <span className="stripe-status-text">{d.connected || 'Connected'}</span>
                <span style={{ fontSize: 12, color: 'var(--fg-secondary)', marginLeft: 4 }}>{d.viaStripe || 'via Stripe'}</span>
              </div>
              <div className="stripe-field">
                <label>{d.publishableKey || 'Publishable Key'}</label>
                <div className="value">pk_live_51H3h...</div>
              </div>
              <div className="stripe-field">
                <label>{d.secretKey || 'Secret Key'}</label>
                <div className="value">sk_live_••••••••••••••••••••••••</div>
              </div>
              <div className="stripe-field">
                <label>{d.webhookUrl || 'Webhook URL'}</label>
                <div className="value">https://api.localplug.com/stripe/webhook</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => showToast(d.reconnect || 'Reconnect Stripe')}>{d.reconnect || 'Reconnect'}</button>
                <button className="btn btn-danger btn-sm" onClick={() => showToast(d.disconnect || 'Disconnect Stripe')}>{d.disconnect || 'Disconnect'}</button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: User Roles & Permissions */}
        <section className="settings-section" id="section-roles">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="settings-section-title">{d.userRoles || 'User Roles & Permissions'}</span>
            <span className="settings-section-desc">{d.manageAccessLevels || 'Manage access levels'}</span>
          </div>
          <div className="settings-section-body" style={{ padding: 0 }}>
            <div className="settings-table table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{d.role || 'Role'}</th>
                    <th>{d.permissions || 'Permissions'}</th>
                    <th>{d.users || 'Users'}</th>
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: d.adminRole || 'Admin', perms: d.adminPerms || 'Full access — all modules, settings, and user management', count: 3, badge: 'badge-accent' },
                    { role: d.managerRole || 'Manager', perms: d.managerPerms || 'Operations + Reports — dispatch, fleet, financial overview', count: 5, badge: 'badge-info' },
                    { role: d.operatorRole || 'Operator', perms: d.operatorPerms || 'Dispatch + Support only — manage bookings and assist guests', count: 12, badge: 'badge-warning' },
                    { role: d.driverRole || 'Driver', perms: d.driverPerms || 'Mobile app access only — view assignments and navigate', count: 24, badge: 'badge-gold' },
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td><span style={{ fontWeight: 600 }}>{item.role}</span></td>
                      <td>{item.perms}</td>
                      <td><span className={`badge ${item.badge}`}>{item.count}</span></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => showToast(d.editRole || 'Edit role')}>{d.edit || 'Edit'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 6: Notification Settings */}
        <section className="settings-section" id="section-notifications">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="settings-section-title">{d.notificationSettings || 'Notification Settings'}</span>
            <span className="settings-section-desc">{d.configureAlerts || 'Configure automated alerts'}</span>
          </div>
          <div className="settings-section-body">
            <div className="check-group">
              {[
                { title: d.notifNewBooking || 'New Booking', channels: ['Email', 'In-App', 'WhatsApp'] },
                { title: d.notifBookingCancelled || 'Booking Cancelled', channels: ['Email', 'In-App'] },
                { title: d.notifDriverAssigned || 'Driver Assigned', channels: ['In-App', 'WhatsApp'] },
                { title: d.notifPaymentReceived || 'Payment Received', channels: ['Email', 'In-App'] },
                { title: d.notifSupportTicket || 'Support Ticket', channels: ['In-App', 'Email'] },
                { title: d.notifEmergencyAlert || 'Emergency Alert', channels: ['In-App', 'WhatsApp', 'SMS'] },
              ].map((item, idx) => (
                <div key={idx} className="check-item checked" onClick={toggleCheck}>
                  <div className="check-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div className="check-info">
                    <div className="check-title">{item.title}</div>
                    <div className="check-channels">
                      {item.channels.map((ch, ci) => (
                        <span key={ci} className="check-channel">{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Language & Regional */}
        <section className="settings-section" id="section-regional">
          <div className="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span className="settings-section-title">{d.languageRegional || 'Language & Regional'}</span>
            <span className="settings-section-desc">{d.localizationPrefs || 'Localization preferences'}</span>
          </div>
          <div className="settings-section-body">
            <div className="select-group">
              <div className="input-group">
                <label className="input-label">{d.defaultLanguage || 'Default Language'}</label>
                <select className="input">
                  <option>{d.langEnglish || 'English'}</option>
                  <option selected>{d.langSpanish || 'Spanish'}</option>
                  <option>{d.langFrench || 'French'}</option>
                  <option>{d.langPortuguese || 'Portuguese'}</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{d.currency || 'Currency'}</label>
                <select className="input">
                  <option>USD ($)</option>
                  <option selected>COP ($)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{d.timezone || 'Timezone'}</label>
                <select className="input">
                  <option selected>America/Bogota (UTC-5)</option>
                  <option>America/New_York (UTC-5)</option>
                  <option>America/Mexico_City (UTC-6)</option>
                  <option>America/Sao_Paulo (UTC-3)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{d.dateFormat || 'Date Format'}</label>
                <select className="input">
                  <option selected>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="save-bar">
          <button className="btn btn-secondary" onClick={() => showToast(d.reset || 'Settings reset')}>{d.cancel || 'Cancel'}</button>
          <button className="btn btn-primary" onClick={saveSettings}>{d.saveSettings || 'Save Settings'}</button>
        </div>

      </div>

      {/* Toast */}
    </div>
  )
}
