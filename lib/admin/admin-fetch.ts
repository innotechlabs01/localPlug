let isRefreshing = false

export async function adminFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: 'include' })
  if (res.status === 401) {
    // Clerk may rotate session tokens — retry once before declaring auth failure
    if (!isRefreshing) {
      isRefreshing = true
      try {
        // Small delay to let Clerk finish token rotation
        await new Promise(r => setTimeout(r, 500))
        const retry = await fetch(input, { ...init, credentials: 'include' })
        if (retry.status !== 401) {
          return retry
        }
      } finally {
        isRefreshing = false
      }
    }
    throw new Error('AUTH_ERROR')
  }
  return res
}
