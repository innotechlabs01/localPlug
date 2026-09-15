'use client'

// Client hook that consumes the realtime outbox.
// Uses /api/events?since=<id> cursor polling (cheap, Vercel-friendly). Each
// event is dispatched to the matching handler by type. Most contributors here
// just trigger a refetch of the existing polling data so the UI stays fresh
// without a big rewrite.
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

    const poll = async () => {
      if (disposed) return
      // Skip polling while the tab is hidden; catch up on the next visible poll.
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const res = await fetch(`/api/realtime/events?since=${cursor}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        // On first connect, jump to the current tail so we only receive NEW
        // events from now on (avoids replaying the whole history on mount;
        // the page already loaded its current state via its own fetch).
        if (!initialized) {
          initialized = true
          cursor = Number(data.cursor ?? cursor)
          return
        }
        for (const ev of (data.events as StreamEvent[] | undefined) || []) {
          if (disposed) return
          cursor = ev.id
          onAnyRef.current?.(ev)
          const handler = handlersRef.current[ev.type]
          if (handler) handler(ev.payload, ev)
        }
      } catch {
        // transient — next poll retries
      }
    }

    poll()
    const timer = setInterval(poll, pollMs)
    return () => {
      disposed = true
      clearInterval(timer)
    }
  }, [pollMs])
}