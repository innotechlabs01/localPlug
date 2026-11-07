import { NextResponse } from 'next/server'

let cachedRate: { rate: number; date: string; fetchedAt: number } | null = null
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    if (cachedRate && (Date.now() - cachedRate.fetchedAt) < CACHE_DURATION_MS) {
      return NextResponse.json({
        rate: cachedRate.rate,
        date: cachedRate.date,
        source: 'dian.gov.co (cached)',
      })
    }

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const dianUrl = `https://www.datos.gov.co/resource/mcec-87by.json?$where= vigenciadesde >= '${startDate}' AND vigenciadesde <= '${endDate}'&$order=vigenciadesde DESC&$limit=1`

    const response = await fetch(dianUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`DIAN API responded with ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('No TRM data found')
    }

    const latest = data[0]
    const rate = parseFloat(latest.valor)

    if (isNaN(rate) || rate <= 0) {
      throw new Error(`Invalid TRM rate: ${latest.valor}`)
    }

    cachedRate = {
      rate,
      date: latest.vigenciadesde || new Date().toISOString().split('T')[0],
      fetchedAt: Date.now(),
    }

    return NextResponse.json({
      rate: cachedRate.rate,
      date: cachedRate.date,
      source: 'dian.gov.co',
    })
  } catch (error) {
    console.error('[TRM API] Error:', error)
    
    if (cachedRate) {
      return NextResponse.json({
        rate: cachedRate.rate,
        date: cachedRate.date,
        source: 'dian.gov.co (stale cache)',
        stale: true,
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch TRM rate', rate: 4200, source: 'fallback' },
      { status: 200 }
    )
  }
}
