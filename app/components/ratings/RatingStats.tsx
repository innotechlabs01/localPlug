'use client'

import { useI18n } from '@/lib/i18n'
import { useRatings, formatResponseTime } from './RatingsProvider'

export default function RatingStats() {
  const { t } = useI18n()
  const { stats } = useRatings()

  return (
    <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12">
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '--'} / 5
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          ⭐ {t.ratings.stats.avg}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {stats.total_ratings > 0 ? stats.total_ratings.toLocaleString() : '--'}
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          👥 {t.ratings.stats.total}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {stats.resolved_pct > 0 ? `${stats.resolved_pct}%` : '--'}
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          ✅ {t.ratings.stats.resolved}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {formatResponseTime(stats.avg_response_time_ms)}
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          ⚡ {t.ratings.stats.response}
        </div>
      </div>
    </div>
  )
}
