import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { sendN8nWebhook } from '@/lib/n8n/client'

export async function GET() {
  const status: Record<string, { ok: boolean; latencyMs: number; error?: string }> = {}

  const dbStart = Date.now()
  try {
    await getDb().execute('SELECT 1')
    status.db = { ok: true, latencyMs: Date.now() - dbStart }
  } catch (err) {
    status.db = { ok: false, latencyMs: Date.now() - dbStart, error: err instanceof Error ? err.message : String(err) }
    logger.error('Health check: DB down', err instanceof Error ? err : undefined)
  }

  const n8nUrl = process.env.N8N_BASE_URL
  if (n8nUrl) {
    const n8nStart = Date.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${n8nUrl}/healthz`, { signal: controller.signal })
      clearTimeout(timeout)
      status.n8n = { ok: res.ok, latencyMs: Date.now() - n8nStart }
    } catch (err) {
      status.n8n = { ok: false, latencyMs: Date.now() - n8nStart, error: err instanceof Error ? err.message : String(err) }
      logger.error('Health check: n8n down', err instanceof Error ? err : undefined)
    }
  }

  const evoUrl = process.env.EVOLUTION_API_URL
  const evoKey = process.env.EVOLUTION_API_KEY
  if (evoUrl && evoKey) {
    const evoStart = Date.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${evoUrl}/instance/connect/${process.env.EVOLUTION_INSTANCE_NAME}`, {
        headers: { apikey: evoKey },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      status.evolution = { ok: res.ok, latencyMs: Date.now() - evoStart }
    } catch (err) {
      status.evolution = { ok: false, latencyMs: Date.now() - evoStart, error: err instanceof Error ? err.message : String(err) }
      logger.error('Health check: Evolution API down', err instanceof Error ? err : undefined)
    }
  }

  const allOk = Object.values(status).every(s => s.ok)

  return NextResponse.json(
    { healthy: allOk, timestamp: new Date().toISOString(), services: status },
    { status: allOk ? 200 : 503 },
  )
}
