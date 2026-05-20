'use client'

import { useI18n } from '@/lib/i18n'
import type { ReactNode } from 'react'

interface StepTravelerProfileProps {
  value: string
  onChange: (value: string) => void
  email: string
  onEmailChange: (email: string) => void
  name: string
  onNameChange: (name: string) => void
  phone: string
  onPhoneChange: (phone: string) => void
}

const profileIcons: Record<string, ReactNode> = {
  family: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  celebration: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  nomad: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  ),
  medical: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9H9l-3-9H2" />
      <path d="M12 2v10" />
    </svg>
  ),
}

export default function StepTravelerProfile({
  value,
  onChange,
  email,
  onEmailChange,
  name,
  onNameChange,
  phone,
  onPhoneChange,
}: StepTravelerProfileProps) {
  const { t } = useI18n()
  const profileT = t.booking.steps.profile

  const profiles = [
    { id: 'family', title: profileT.family, description: profileT.familyDesc },
    { id: 'celebration', title: profileT.celebration, description: profileT.celebrationDesc },
    { id: 'nomad', title: profileT.nomad, description: profileT.nomadDesc },
    { id: 'medical', title: profileT.medical, description: profileT.medicalDesc },
  ]

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{profileT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {profileT.subtitle}
      </p>

      <div className="mb-8 space-y-4">
        <div>
          <label htmlFor="traveler-name" className="block text-label-md text-[var(--text-primary)] font-semibold mb-1.5">
            {t.common.fullName}
          </label>
          <input
            id="traveler-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t.booking.steps.profile.namePlaceholder}
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-body-md text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/40 focus:border-[var(--accent-gold)] transition-all"
          />
        </div>
        <div>
          <label htmlFor="traveler-email" className="block text-label-md text-[var(--text-primary)] font-semibold mb-1.5">
            {t.common.email}
          </label>
          <input
            id="traveler-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={t.booking.steps.profile.emailPlaceholder}
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-body-md text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/40 focus:border-[var(--accent-gold)] transition-all"
          />
        </div>
        <div>
          <label htmlFor="traveler-phone" className="block text-label-md text-[var(--text-primary)] font-semibold mb-1.5">
            {t.common.phone}
          </label>
          <input
            id="traveler-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={t.booking.steps.profile.phonePlaceholder}
            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-body-md text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/40 focus:border-[var(--accent-gold)] transition-all"
          />
          <p className="text-body-sm text-[var(--text-muted)] mt-1">
            {t.booking.steps.profile.phoneHint}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`text-left p-5 rounded-[var(--radius-md)] border-2 transition-all duration-200 hover:-translate-y-0.5 ${
              value === p.id
                ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)] hover:shadow-level-1'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                value === p.id
                  ? 'bg-[var(--accent-gold)] text-[var(--bg-dark)]'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)]'
              }`}
            >
              {profileIcons[p.id]}
            </div>
            <h3 className="text-display-md text-white mb-1">{p.title}</h3>
            <p className="text-body-md text-[var(--text-secondary)]">{p.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
