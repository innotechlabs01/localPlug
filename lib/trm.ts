// TRM (Tasa Representativa del Mercado) service
// Fetches real-time USD/COP exchange rate with caching

const TRM_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'
const CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour

interface TrmCache {
  rate: number
  fetchedAt: number
}

let cache: TrmCache | null = null

export async function getTrmRate(): Promise<number> {
  // Return cached rate if still valid
  if (cache && Date.now() - cache.fetchedAt < CACHE_DURATION_MS) {
    return cache.rate
  }

  try {
    const res = await fetch(TRM_API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!res.ok) {
      console.error('[TRM] API error:', res.status)
      // Return cached rate if available, otherwise default
      return cache?.rate ?? 4200
    }

    const data = await res.json()
    const copRate = data.rates?.COP

    if (copRate && typeof copRate === 'number' && copRate > 0) {
      cache = { rate: copRate, fetchedAt: Date.now() }
      console.log(`[TRM] Updated: 1 USD = ${copRate} COP`)
      return copRate
    }

    console.error('[TRM] Invalid COP rate in response')
    return cache?.rate ?? 4200
  } catch (err) {
    console.error('[TRM] Fetch error:', err)
    return cache?.rate ?? 4200
  }
}

export function convertCopToUsd(copAmount: number, trmRate: number): number {
  return Math.round(copAmount / trmRate)
}

export function formatCop(amount: number): string {
  return `$ ${amount.toLocaleString('es-CO')} COP`
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')} USD`
}
