'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'

/**
 * Typed wrapper around TanStack Query useQuery.
 * Use for GET endpoints. Automatically caches, retries, and dedupes identical requests.
 */
export function useApiQuery<TData = unknown, TError = Error>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: fetcher,
    ...options,
  })
}

/**
 * Typed wrapper around TanStack Query useMutation.
 * Use for POST/PUT/PATCH/DELETE endpoints. Invalidates related queries on success.
 */
export function useApiMutation<TData = unknown, TError = Error, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, unknown>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useMutation<TData, TError, TVariables, unknown>({
    mutationFn,
    ...options,
    // Invalidate queries when mutation settles so refetch picks up new data.
    onSettled: async (...args) => {
      await options?.onSettled?.(...args)
      // Invalidate all queries when mutation settles so refetch picks up new data.
      await queryClient.invalidateQueries()
    },
  })
}

/**
 * Shared event hook used by HeroSection and FeriaSection so /api/events is
 * fetched only once per page load instead of twice.
 */
export function useEvents() {
  return useApiQuery<{ ai_chat_message?: any; hero_banner?: any; section?: any } | null>(
    ['events'],
    async () => {
      const res = await fetch('/api/events', { cache: 'no-store' })
      if (!res.ok) return null
      return res.json()
    },
    { retry: 1 },
  )
}
