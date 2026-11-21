'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface OutboxRow {
  id: number
  type: string
  correlation_id: string | null
  status: string
  retry_count: number
  max_retries: number
  error_message: string | null
  processed_at: string | null
  created_at: string
}

export default function AdminOutboxPage() {
  const [counts, setCounts] = useState({ pending: 0, processing: 0, published: 0, failed: 0 })
  const [events, setEvents] = useState<OutboxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const { showToast } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/outbox', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCounts(data.counts || { pending: 0, processing: 0, published: 0, failed: 0 })
        setEvents(data.events || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const triggerAction = async (action: 'process' | 'retry' | 'retry_all_failed', eventId?: number) => {
    setRunning(true)
    try {
      const res = await adminFetch('/api/admin/outbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, eventId }),
      })
      if (res.ok) {
        const data = await res.json()
        showToast?.(`Procesados: ${data.stats?.processed ?? 0} (OK: ${data.stats?.succeeded ?? 0}, Fallidos: ${data.stats?.failed ?? 0})`)
        await load()
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="admin-page space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="admin-page-title">Event Queue &amp; Dead Letter (Outbox)</h1>
          <p className="admin-section-desc">Monitoreo en vivo de eventos de dominio y reintentos idempotentes.</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={running}
            onClick={() => triggerAction('process')}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50"
          >
            Procesar Pendientes
          </button>
          {counts.failed > 0 && (
            <button
              disabled={running}
              onClick={() => triggerAction('retry_all_failed')}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold"
            >
              Reintentar Fallidos ({counts.failed})
            </button>
          )}
        </div>
      </div>

      <div className="admin-grid-4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Pendientes</div>
          <div className="admin-kpi-value">{counts.pending}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">En Proceso</div>
          <div className="admin-kpi-value">{counts.processing}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Entregados</div>
          <div className="admin-kpi-value">{counts.published}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Dead Letter (Fallidos)</div>
          <div className="admin-kpi-value">{counts.failed}</div>
        </div>
      </div>

      <div className="admin-card overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-[var(--fg-muted)]">Cargando eventos...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--fg-muted)]">
                <th className="p-3">ID</th>
                <th className="p-3">Evento</th>
                <th className="p-3">Correlation</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Reintentos</th>
                <th className="p-3">Error</th>
                <th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-[var(--border)]">
                  <td className="p-3 font-mono text-xs">#{ev.id}</td>
                  <td className="p-3 font-medium">{ev.type}</td>
                  <td className="p-3 font-mono text-xs">{ev.correlation_id || '—'}</td>
                  <td className="p-3">
                    <span className={`admin-badge ${ev.status === 'published' ? 'accent' : ev.status === 'failed' ? 'danger' : 'warning'}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="p-3">{ev.retry_count}/{ev.max_retries}</td>
                  <td className="p-3 text-xs text-red-400 max-w-xs truncate">{ev.error_message || '—'}</td>
                  <td className="p-3">
                    {ev.status === 'failed' && (
                      <button
                        disabled={running}
                        onClick={() => triggerAction('retry', ev.id)}
                        className="px-2.5 py-1 rounded border border-[var(--border)] text-xs font-medium"
                      >
                        Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
