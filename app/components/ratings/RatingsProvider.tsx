'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface Rating {
  id: number
  customer_name: string
  customer_country: string
  rating: number
  comment: string
  created_at: string
}

interface RatingStats {
  avg_rating: number
  total_ratings: number
  resolved_pct: number
  avg_response_time_ms: number | null
}

interface RatingsContextValue {
  ratings: Rating[]
  stats: RatingStats
  isLoading: boolean
}

const RatingsContext = createContext<RatingsContextValue>({
  ratings: [],
  stats: { avg_rating: 0, total_ratings: 0, resolved_pct: 0, avg_response_time_ms: null },
  isLoading: true,
})

export function useRatings() {
  return useContext(RatingsContext)
}

function formatResponseTime(ms: number | null): string {
  if (ms == null) return '--'
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`
  return `${Math.round(ms / 3_600_000)}h`
}

export { formatResponseTime }

export default function RatingsProvider({ children }: { children: ReactNode }) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats>({
    avg_rating: 0,
    total_ratings: 0,
    resolved_pct: 0,
    avg_response_time_ms: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchRatings = useCallback(async () => {
    try {
      const res = await fetch('/api/ratings')
      const data = await res.json()
      if (data.ratings) setRatings(data.ratings)
    } catch {
      // silent
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/ratings/stats')
      const data = await res.json()
      if (data.avg_rating !== undefined) setStats(data)
    } catch {
      // silent
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchRatings(), fetchStats()])
    setIsLoading(false)
  }, [fetchRatings, fetchStats])

  useEffect(() => {
    fetchAll()

    const ratingsInterval = setInterval(fetchRatings, 15_000)
    const statsInterval = setInterval(fetchStats, 30_000)

    // Pause polling when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(ratingsInterval)
        clearInterval(statsInterval)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(ratingsInterval)
      clearInterval(statsInterval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchAll, fetchRatings, fetchStats])

  return (
    <RatingsContext.Provider value={{ ratings, stats, isLoading }}>
      {children}
    </RatingsContext.Provider>
  )
}
