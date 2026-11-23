/**
 * Shared TanStack Query client + helper hooks.
 * Replaces ad-hoc fetch + useState + useEffect + setInterval patterns across pages.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s
      gcTime: 5 * 60 * 1000, // 5min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
