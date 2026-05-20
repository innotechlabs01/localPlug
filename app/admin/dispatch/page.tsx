'use client'

import { useI18n } from '@/lib/i18n'

export default function DispatchPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-slate-navy">{t.admin.placeholders.dispatch}</h1>
        <p className="text-body-md text-cool-slate-500 mt-1">{t.admin.placeholders.dispatchDesc}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cool-slate-100 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-mountain-emerald/10 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>
        <h2 className="text-display-md text-slate-navy mb-2">{t.admin.placeholders.comingSoon}</h2>
        <p className="text-body-md text-cool-slate-500 max-w-md mx-auto">
          {t.admin.placeholders.dispatchDesc}
        </p>
      </div>
    </div>
  )
}
