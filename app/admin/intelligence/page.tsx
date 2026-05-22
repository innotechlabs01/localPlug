'use client'

import { useI18n } from '@/lib/i18n'

export default function IntelligencePage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-semibold text-[#f0f2f5]">{t.admin.placeholders.intelligence}</h1>
        <p className="text-[13px] text-[#646880] mt-1">{t.admin.placeholders.intelligenceDesc}</p>
      </div>

      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h2 className="text-[16px] font-semibold text-[#f0f2f5] mb-2">{t.admin.placeholders.comingSoon}</h2>
        <p className="text-[13px] text-[#9ca0b0] max-w-md mx-auto">
          {t.admin.placeholders.intelligenceDesc}
        </p>
      </div>
    </div>
  )
}
