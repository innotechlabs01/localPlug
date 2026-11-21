'use client'

// Client hook that consumes the realtime outbox.
// Uses native SSE (/api/realtime/events/stream?since=<id>) when EventSource is
// available, with automatic fallback to cursor polling (/api/realtime/events).
import { useEffect, useRef } from 'react'

interface StreamEvent {
  id: number
  type: string
  payload: Record<string, unknown>
}

export function useEventStream(
  handlers: Record<string, (payload: Record<string, unknown>, event: StreamEvent) => void>,
  opts: { pollMs?: number; onAny?: (event: StreamEvent) => void } = {},
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const onAnyRef = useRef(opts.onAny)
  onAnyRef.current = opts.onAny
  const pollMs = opts.pollMs ?? 5000

  useEffect(() => {
    let cursor = 0
    let initialized = false
    let disposed = false
    let timer: ReturnType<typeof setInterval> | null = null
    let es: EventSource | null = null

    const dispatchEvents = (events: StreamEvent[]) => {
      for (const ev of events) {
        if (disposed) return
        cursor = ev.id
        onAnyRef.current?.(ev)
        const handler = handlersRef.current[ev.type]
        if (handler) handler(ev.payload, ev)
      }
    }

    const startPolling = () => {
      if (disposed || timer) return
      const poll = async () => {
        if (disposed) return
        if (typeof document !== 'undefined' && document.hidden) return
        try {
          const res = await fetch(`/api/realtime/events?since=${cursor}`, { cache: 'no-store' })
          if (res.status === 401 || res.status === 403) {
            disposed = true
            if (timer) clearInterval(timer)
            return
          }
          if (!res.ok) return
          const data = await res.json()
          if (!initialized) {
            initialized = true
            cursor = Number(data.cursor ?? cursor)
            return
          }
          dispatchEvents((data.events as StreamEvent[] | undefined) || [])
        } catch {
          // transient — next poll retries
        }
      }
      poll()
      timer = setInterval(poll, pollMs)
    }

    // Prefer native SSE when available in browser
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      let sseErrors = 0
      const connectSse = async () => {
        // Initialize cursor at current tail first so we only stream new events
        try {
          const res = await fetch(`/api/realtime/events?since=0`, { cache: 'no-store' })
          if (res.status === 401 || res.status === 403) {
            disposed = true
            return
          }
          if (res.ok) {
            const data = await res.json()
            cursor = Number(data.cursor ?? 0)
            initialized = true
          }
        } catch {}

        if (disposed) return
        es = new EventSource(`/api/realtime/events/stream?since=${cursor}`)
        es.onmessage = (msg) => {
          if (disposed) return
          sseErrors = 0
          try {
            const ev = JSON.parse(msg.data) as StreamEvent
            if (ev && typeof ev.id === 'number') {
              dispatchEvents([ev])
            }
          } catch {}
        }
        es.onerror = () => {
          sseErrors++
          if (sseErrors >= 3) {
            es?.close()
            es = null
            startPolling()
          }
        }
      }
      connectSse()
    } else {
      startPolling()
    }

    const onVisibility = () => {
      if (!document.hidden && !disposed && !es && timer) {
        fetch(`/api/realtime/events?since=${cursor}`, { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data?.events) dispatchEvents(data.events)
          })
          .catch(() => {})
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      disposed = true
      es?.close()
      if (timer) clearInterval(timer)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [pollMs])
}
