import { useEffect, useRef } from 'react'

interface UsePollingOptions {
  intervalMs?: number
  enabled?: boolean
}

export function usePolling(
  fetchFn: () => Promise<void>,
  { intervalMs = 10_000, enabled = true }: UsePollingOptions = {},
) {
  const fetchFnRef = useRef(fetchFn)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep ref fresh so interval always calls latest fetchFn
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return

    const start = () => {
      stop()
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchFnRef.current()
        }
      }, intervalMs)
    }

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible — immediate refetch
        fetchFnRef.current()
        start()
      } else {
        // Tab hidden — pause interval
        stop()
      }
    }

    const onFocus = () => {
      fetchFnRef.current()
    }

    // Start polling
    start()

    // Listen for visibility & focus changes
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
    }
  }, [intervalMs, enabled])
}
