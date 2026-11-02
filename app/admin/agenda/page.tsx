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

  useEffect(() => {
    const checkDayChange = setInterval(() => {
      const today = getToday()
      if (today !== selectedDate) setSelectedDate(today)
    }, 60_000)
    return () => clearInterval(checkDayChange)
  }, [selectedDate])

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        const today = getToday()
        if (today !== selectedDate) setSelectedDate(today)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [selectedDate])

  useEffect(() => {
    adminFetch(`/api/admin/agenda?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedDate])

  const typeBadge: Record<string, string> = {
    arrival: 'admin-badge accent',
    departure: 'admin-badge info',
    meeting: 'admin-badge gold',
    task: 'admin-badge warning',
  }

  const typeLabel: Record<string, string> = {
    arrival: 'Llegada',
    departure: 'Salida',
    meeting: 'Reunión',
    task: 'Tarea',
  }

  const statusBadge: Record<string, string> = {
    completed: 'admin-badge accent',
    cancelled: 'admin-badge danger',
    pending: 'admin-badge neutral',
  }

  if (loading) {
    return (
      <div className="admin-skeleton-text long" style={{ height: 300 }} />
    )
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-card">
        <div className="admin-card-header admin-flex-between">
          <div>
            <h1 className="admin-page-title">{t.admin.agenda.title}</h1>
            <p className="admin-section-desc">{t.admin.agenda.subtitle}</p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="admin-input admin-input-sm"
          />
        </div>
        <div className="admin-card-body">
          <div className="space-y-3">
            {items.sort((a, b) => a.time.localeCompare(b.time)).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-[6px] border"
              >
                <div className="text-[14px] font-bold text-[var(--ui-fg)] w-16">
                  {item.time}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[var(--ui-fg)]">{item.title}</p>
                  <p className="text-[13px] text-[var(--ui-fg-secondary)]">{item.customer}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusBadge[item.status]}`}>
                    {item.status}
                  </span>
                  <span className={`admin-badge ${typeBadge[item.type]}`}>
                    {typeLabel[item.type]}
                  </span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="admin-empty" style={{ padding: '32px 24px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <h3>{t.admin.agenda?.noActivities || 'No activities scheduled for this date.'}</h3>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function AgendaPage() {
  return (
    <I18nProvider>
      <AgendaInner />
    </I18nProvider>
  )
}
