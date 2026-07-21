import { NextResponse } from 'next/server'

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET

export function verifyWebhookSecret(req: Request): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] No N8N_WEBHOOK_SECRET configured, denying request')
    return false
  }

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  const secretHeader = req.headers.get('x-webhook-secret') || ''

  return token === WEBHOOK_SECRET || secretHeader === WEBHOOK_SECRET
}

export function requireWebhookAuth(req: Request): NextResponse | null {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
