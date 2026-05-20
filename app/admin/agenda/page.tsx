'use client'

import { useState, useEffect } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetch(`/api/admin/agenda?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedDate])

  const typeColors: Record<string, string> = {
    arrival: 'bg-green-100 text-green-800 border-green-200',
    departure: 'bg-blue-100 text-blue-800 border-blue-200',
    meeting: 'bg-purple-100 text-purple-800 border-purple-200',
    task: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cool-slate-500">Loading agenda...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg text-slate-navy">{t.admin.agenda.title}</h1>
          <p className="text-body-md text-cool-slate-500 mt-1">{t.admin.agenda.subtitle}</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-cool-slate-200 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-mountain-emerald/20 focus:border-mountain-emerald"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cool-slate-100 p-6">
        <div className="space-y-4">
          {items.sort((a, b) => a.time.localeCompare(b.time)).map((item) => (
            <div key={item.id} className={`flex items-center gap-4 p-4 rounded-lg border ${typeColors[item.type]}`}>
              <div className="text-label-lg font-bold text-slate-navy w-16">
                {item.time}
              </div>
              <div className="flex-1">
                <p className="text-label-md text-slate-navy">{item.title}</p>
                <p className="text-body-md text-cool-slate-600">{item.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-cool-slate-100 text-cool-slate-600'
                }`}>
                  {item.status}
                </span>
                <button className="p-1.5 hover:bg-white/50 rounded-lg transition-colors">
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
            <div className="p-12 text-center text-cool-slate-500">
              No activities scheduled for this date.
            </div>
          )}
        </div>
      </div>
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
