'use client'

import { useState, useEffect } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { getToday } from '@/lib/date-utils'
import { RealtimeProvider } from '@/lib/admin/realtime-context'

interface AgendaItem {
  id: number
  title: string
  time: string
  type: 'arrival' | 'departure' | 'meeting' | 'task'
  customer: string
  status: 'pending' | 'completed' | 'cancelled'
}

function AgendaInner() {
  const { t } = useI18n()
  const [items, setItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(getToday())

  // Auto-refresh when day changes
  useEffect(() => {
    const checkDayChange = setInterval(() => {
      const today = getToday()
      if (today !== selectedDate) {
        setSelectedDate(today)
      }
    }, 60_000) // Check every minute
    return () => clearInterval(checkDayChange)
  }, [selectedDate])

  // Refresh data when page becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        const today = getToday()
        if (today !== selectedDate) {
          setSelectedDate(today)
        }
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [selectedDate])

  useEffect(() => {
    adminFetch(`/api/admin/agenda?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedDate])

  const typeColors: Record<string, string> = {
    arrival: 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.3)]',
    departure: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]',
    meeting: 'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6] border-[rgba(139,92,246,0.3)]',
    task: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[rgba(245,158,11,0.3)]',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646880]">{t.admin.agenda?.loading || 'Loading agenda...'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5]">{t.admin.agenda.title}</h1>
          <p className="text-[13px] text-[#646880] mt-1">{t.admin.agenda.subtitle}</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        />
      </div>

      <div className="bg-[#181b25] border border-[#282b38] rounded-[10px] p-5">
        <div className="space-y-3">
          {items.sort((a, b) => a.time.localeCompare(b.time)).map((item) => (
            <div key={item.id} className={`flex items-center gap-4 p-4 rounded-[6px] border ${typeColors[item.type]}`}>
              <div className="text-[14px] font-bold text-[#f0f2f5] w-16">
                {item.time}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#f0f2f5]">{item.title}</p>
                <p className="text-[13px] text-[#9ca0b0]">{item.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  item.status === 'completed' ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' :
                  item.status === 'cancelled' ? 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]' :
                  'bg-[rgba(100,104,128,0.12)] text-[#646880]'
                }`}>
                  {item.status}
                </span>
                <button className="p-1.5 hover:bg-[#202330] rounded-[4px] text-[#9ca0b0] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-12 text-center text-[#646880]">
              {t.admin.agenda?.noActivities || 'No activities scheduled for this date.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgendaPage() {
  return (
    <RealtimeProvider>
      <I18nProvider>
        <AgendaInner />
      </I18nProvider>
    </RealtimeProvider>
  )
}
