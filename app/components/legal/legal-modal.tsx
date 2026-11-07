'use client'

import { useI18n } from '@/lib/i18n'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  pageKey: 'terms' | 'privacy' | 'refund'
}

export default function LegalModal({ isOpen, onClose, pageKey }: LegalModalProps) {
  const { t } = useI18n()
  
  if (!isOpen) return null

  const titleKey = pageKey === 'terms' ? 'termsTitle' : pageKey === 'privacy' ? 'privacyTitle' : 'refundTitle'

  const legal = t.legal as unknown as Record<string, string>
  const title = legal[titleKey] || titleKey

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-2xl max-h-[80vh] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--glass)] text-[var(--text-muted)] hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="text-[var(--text-secondary)] text-[14px] leading-relaxed space-y-5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_h2]:mb-2 [&_p]:mb-3">
            {((t.legal.content as Record<string, Array<{heading: string; body: string}>>)?.[pageKey] || []).map((section, i) => (
              <section key={i}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-[var(--bg-dark)] text-sm font-medium hover:bg-[var(--accent-gold-light)] transition-colors"
          >
            {t.common.dismiss || 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
