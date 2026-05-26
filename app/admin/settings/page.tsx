'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

const navItems = [
  { id: 'general', icon: '<path d="M12 15V3m0 12l-4-4m4 4l4-4M3 21h18"/>', label: 'General' },
  { id: 'branding', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/>', label: 'Branding' },
  { id: 'notifications', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', label: 'Notifications' },
  { id: 'payments', icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>', label: 'Payments' },
  { id: 'security', icon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', label: 'Security' },
  { id: 'plan', icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>', label: 'Plan & Billing' },
  { id: 'integrations', icon: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>', label: 'Integrations' },
  { id: 'team', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', label: 'Team' },
]

export default function SettingsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).settings ?? {}
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000) }

  return (
    <div className="settings-layout">
      {/* ── Sidebar Nav ── */}
      <nav className="settings-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: item.icon }} />
            {item.label}
          </div>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="settings-content">
        {/* General */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15V3m0 12l-4-4m4 4l4-4M3 21h18"/></svg>
              <span className="settings-section-title">{d.generalSettings || 'General Settings'}</span>
              <span className="settings-section-desc">{d.manageAppConfig || 'Manage your application configuration'}</span>
            </div>
            <div className="settings-section-body">
              <div className="form-grid">
                <div className="full form-group"><label className="input-label">{d.companyName || 'Company Name'}</label><input className="input" placeholder="LocalPlug" /></div>
                <div className="form-group"><label className="input-label">{d.timezone || 'Timezone'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>America/Bogota (UTC-5)</option><option>America/Mexico_City (UTC-6)</option><option>America/New_York (UTC-4)</option><option>Europe/Madrid (UTC+2)</option></select>
                </div>
                <div className="form-group"><label className="input-label">{d.dateFormat || 'Date Format'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select>
                </div>
                <div className="full form-group"><label className="input-label">{d.defaultLanguage || 'Default Language'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>English (EN)</option><option>Spanish (ES)</option><option>Portuguese (PT)</option></select>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button className="btn btn-primary" onClick={() => showToast(d.saved || 'Saved')}>{d.saveChanges || 'Save Changes'}</button>
                <button className="btn btn-secondary" onClick={() => showToast(d.reset || 'Defaults restored')}>{d.resetDefaults || 'Reset to Defaults'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Branding */}
        {activeTab === 'branding' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>
              <span className="settings-section-title">{d.branding || 'Branding'}</span>
              <span className="settings-section-desc">{d.customizeAppearance || 'Customize your brand appearance'}</span>
            </div>
            <div className="settings-section-body">
              <div className="form-grid">
                <div className="form-group"><label className="input-label">{d.primaryColor || 'Primary Color'}</label><input className="input" type="color" defaultValue="#10b981" style={{ height: 42, padding: 4 }} /></div>
                <div className="form-group"><label className="input-label">{d.accentColor || 'Accent Color'}</label><input className="input" type="color" defaultValue="#6366f1" style={{ height: 42, padding: 4 }} /></div>
                <div className="full form-group">
                  <label className="input-label">{d.companyLogo || 'Company Logo'}</label>
                  <div className="logo-upload" onClick={() => showToast(d.uploadLogo || 'Upload dialog opened')}>
                    <div className="logo-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{d.uploadLogo || 'Upload Logo'}</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>PNG, JPG or SVG · Max 2MB</div></div>
                  </div>
                </div>
                <div className="full form-group"><label className="input-label">{d.customCSS || 'Custom CSS'}</label><textarea className="input" rows={3} placeholder="/* Add custom styles */" style={{ fontFamily: 'monospace', fontSize: 13 }} /></div>
              </div>
              <button className="btn btn-primary mt-4" onClick={() => showToast(d.saved || 'Saved')}>{d.saveChanges || 'Save Changes'}</button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="settings-section-title">{d.notificationSettings || 'Notification Settings'}</span>
              <span className="settings-section-desc">{d.configureAlerts || 'Configure how your team gets notified'}</span>
            </div>
            <div className="settings-section-body">
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', desc: 'Receive booking confirmations and updates via email' },
                  { label: 'SMS Notifications', desc: 'Get SMS alerts for urgent bookings and cancellations' },
                  { label: 'Push Notifications', desc: 'Browser push notifications for new reservations' },
                  { label: 'Booking Reminders', desc: 'Send automated reminders 24h before booking' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <label className="switch">
                      <input type="checkbox" defaultChecked={idx < 2} />
                      <span className="slider" />
                    </label>
                    <div><div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{item.desc}</div></div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary mt-4" onClick={() => showToast(d.saved || 'Saved')}>{d.saveChanges || 'Save Changes'}</button>
            </div>
          </div>
        )}

        {/* Payments */}
        {activeTab === 'payments' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              <span className="settings-section-title">{d.paymentSettings || 'Payment Settings'}</span>
              <span className="settings-section-desc">{d.configureGateway || 'Configure your payment gateway'}</span>
            </div>
            <div className="settings-section-body">
              <div className="form-grid">
                <div className="form-group"><label className="input-label">{d.paymentGateway || 'Payment Gateway'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>Stripe</option><option>PayPal</option><option>Mercado Pago</option></select>
                </div>
                <div className="form-group"><label className="input-label">{d.currency || 'Currency'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>USD ($)</option><option>COP ($)</option><option>EUR (€)</option></select>
                </div>
                <div className="form-group"><label className="input-label">{d.stripePublicKey || 'Stripe Public Key'}</label><input className="input" placeholder="pk_live_..." /></div>
                <div className="form-group"><label className="input-label">{d.stripeSecretKey || 'Stripe Secret Key'}</label><input className="input" type="password" placeholder="sk_live_..." /></div>
              </div>
              <button className="btn btn-primary mt-4" onClick={() => showToast(d.saved || 'Saved')}>{d.saveChanges || 'Save Changes'}</button>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span className="settings-section-title">{d.securitySettings || 'Security Settings'}</span>
              <span className="settings-section-desc">{d.manageSecurity || 'Manage security and access policies'}</span>
            </div>
            <div className="settings-section-body">
              <div className="form-grid">
                <div className="form-group"><label className="input-label">{d.passwordPolicy || 'Password Policy'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>{d.standard || 'Standard (8+ chars)'}</option><option>{d.strong || 'Strong (8+ chars, mixed case, special)'}</option></select>
                </div>
                <div className="form-group"><label className="input-label">{d.sessionTimeout || 'Session Timeout'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>24 hours</option></select>
                </div>
                <div className="form-group">
                  <label className="input-label">{d.twoFactorAuth || 'Two-Factor Auth'}</label>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="switch"><input type="checkbox" /><span className="slider" /></label>
                    <span style={{ fontSize: 13 }}>{d.enable2FA || 'Require 2FA for all admin users'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">{d.ipWhitelist || 'IP Whitelist'}</label>
                  <input className="input" placeholder="192.168.1.0/24, 10.0.0.1" />
                </div>
              </div>
              <button className="btn btn-primary mt-4" onClick={() => showToast(d.saved || 'Saved')}>{d.saveChanges || 'Save Changes'}</button>
            </div>
          </div>
        )}

        {/* Plan & Billing */}
        {activeTab === 'plan' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="settings-section-title">{d.planBilling || 'Plan & Billing'}</span>
              <span className="settings-section-desc">{d.manageSubscription || 'Manage your subscription and billing'}</span>
            </div>
            <div className="settings-section-body">
              <div className="plan-cards">
                {[
                  { name: 'Starter', sub: 'For small operators', price: '$29', yearly: '$290/yr', popular: false },
                  { name: 'Professional', sub: 'For growing fleets', price: '$79', yearly: '$790/yr', popular: true },
                  { name: 'Enterprise', sub: 'For large operations', price: '$199', yearly: '$1,990/yr', popular: false },
                ].map((plan, idx) => (
                  <div key={idx} className={`plan-card ${plan.popular ? 'featured' : ''}`}>
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-sub">{plan.sub}</div>
                    <div className="plan-price-row"><span className="plan-price-label">{d.monthly || 'Monthly'}</span><span className="plan-price-value">{plan.price}</span></div>
                    <div className="plan-price-row"><span className="plan-price-label">{d.yearly || 'Yearly'}</span><span className="plan-price-value">{plan.yearly}</span></div>
                    <button className={`btn w-full mt-4 ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                      {plan.popular ? (d.currentPlan || 'Current Plan') : (d.upgrade || 'Upgrade')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              <span className="settings-section-title">{d.integrationSettings || 'Integrations'}</span>
              <span className="settings-section-desc">{d.connectServices || 'Connect third-party services'}</span>
            </div>
            <div className="settings-section-body">
              <div className="form-grid">
                <div className="form-group"><label className="input-label">{d.mapsProvider || 'Maps Provider'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>Google Maps</option><option>Mapbox</option><option>OpenStreetMap</option></select>
                </div>
                <div className="form-group"><label className="input-label">{d.crmIntegration || 'CRM Integration'}</label>
                  <select className="input" style={{ appearance: 'auto' }}><option>None</option><option>HubSpot</option><option>Salesforce</option></select>
                </div>
                <div className="form-group"><label className="input-label">{d.whatsappIntegration || 'WhatsApp Integration'}</label>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="switch"><input type="checkbox" defaultChecked /><span className="slider" /></label>
                    <span style={{ fontSize: 13 }}>{d.enableWhatsApp || 'Enable WhatsApp notifications'}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary mt-4" onClick={() => showToast(d.saved || 'Saved')}>{d.saveChanges || 'Save Changes'}</button>
            </div>
          </div>
        )}

        {/* Team */}
        {activeTab === 'team' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span className="settings-section-title">{d.teamManagement || 'Team Management'}</span>
              <span className="settings-section-desc">{d.manageAdmins || 'Manage admin users and permissions'}</span>
            </div>
            <div className="settings-section-body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Admin User', email: 'admin@localplug.com', role: 'Super Admin', status: 'Active', last: 'Just now' },
                      { name: 'Maria García', email: 'maria@localplug.com', role: 'Manager', status: 'Active', last: '2h ago' },
                      { name: 'Carlos López', email: 'carlos@localplug.com', role: 'Operator', status: 'Active', last: 'Yesterday' },
                      { name: 'Ana Fernández', email: 'ana@localplug.com', role: 'Operator', status: 'Inactive', last: '1 week ago' },
                    ].map((member, idx) => (
                      <tr key={idx}>
                        <td><span style={{ fontWeight: 500 }}>{member.name}</span></td>
                        <td className="text-fg-muted">{member.email}</td>
                        <td><span className="badge badge-accent">{member.role}</span></td>
                        <td><span className={`badge ${member.status === 'Active' ? 'badge-green' : 'badge-muted'}`}>{member.status}</span></td>
                        <td className="text-fg-muted">{member.last}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => showToast(d.editUser || 'Edit user')}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary mt-4" onClick={() => showToast(d.inviteUser || 'Invite sent')}>Invite User</button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[2000] px-4 py-3 rounded-[8px] text-[13px] font-medium shadow-lg" style={{ background: 'var(--accent)', color: 'white' }}>
          {toast}
        </div>
      )}
    </div>
  )
}