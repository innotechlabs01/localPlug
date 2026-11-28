import { NextResponse } from 'next/server'
import { getAllPublicConfig, ConfigLoadError } from '@/lib/config'
import { applySecurity } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const security = await applySecurity(request)
  if (security) return security

  try {
    const config = await getAllPublicConfig()
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    })
  } catch (err) {
    if (err instanceof ConfigLoadError) {
      return NextResponse.json(
        {
          error: 'config_unavailable',
          message:
            'Service temporarily unavailable. Configuration could not be loaded.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'server_error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
