import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 3) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  try {
    const encoded = encodeURIComponent(q.trim())
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=co`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LocalPlug/1.0 (https://localplug.vercel.app)',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocode failed' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Could not search address' }, { status: 502 })
  }
}
