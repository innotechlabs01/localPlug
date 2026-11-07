import { useEffect, useRef, useCallback } from 'react'

interface UsePollingOptions {
  intervalMs?: number
  enabled?: boolean
  onAuthError?: () => void
}

export function usePolling(
  fetchFn: () => Promise<void>,
  { intervalMs = 10_000, enabled = true, onAuthError }: UsePollingOptions = {},
) {
  const fetchFnRef = useRef(fetchFn)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppedRef = useRef(false)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (stoppedRef.current) return
    stop()
    intervalRef.current = setInterval(async () => {
      if (!document.hidden) {
        try {
          await fetchFnRef.current()
        } catch (err: unknown) {
          if (err instanceof Error && err.message === 'AUTH_ERROR') {
            stoppedRef.current = true
            stop()
            onAuthError?.()
            return
          }
        }
      }
    }, intervalMs)
  }, [intervalMs, stop, onAuthError])

  // Keep ref fresh so interval always calls latest fetchFn
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return

    // Reset stopped state when enabled changes
    stoppedRef.current = false

    start()

    const onVisibilityChange = () => {
      if (!document.hidden && !stoppedRef.current) {
        fetchFnRef.current()
        start()
      } else {
        stop()
      }
    }

    const onFocus = () => {
      if (!stoppedRef.current) {
        fetchFnRef.current()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
    }
  }, [intervalMs, enabled, start, stop])
}
