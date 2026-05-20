'use client'

import { useI18n } from '@/lib/i18n'

export default function GridPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-slate-navy">{t.admin.placeholders.grid}</h1>
        <p className="text-body-md text-cool-slate-500 mt-1">{t.admin.placeholders.gridDesc}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cool-slate-100 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-mountain-emerald/10 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <h2 className="text-display-md text-slate-navy mb-2">{t.admin.placeholders.comingSoon}</h2>
        <p className="text-body-md text-cool-slate-500 max-w-md mx-auto">
          {t.admin.placeholders.gridDesc}
        </p>
      </div>
    </div>
  )
}
