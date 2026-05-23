'use client'

import { useI18n } from '@/lib/i18n'

export default function LogisticsPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-semibold text-[#f0f2f5]">{t.admin.placeholders.logistics}</h1>
        <p className="text-[13px] text-[#646880] mt-1">{t.admin.placeholders.logisticsDesc}</p>
      </div>

      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <h2 className="text-[16px] font-semibold text-[#f0f2f5] mb-2">{t.admin.placeholders.comingSoon}</h2>
        <p className="text-[13px] text-[#9ca0b0] max-w-md mx-auto">
          {t.admin.placeholders.logisticsDesc}
        </p>
      </div>
    </div>
  )
}
