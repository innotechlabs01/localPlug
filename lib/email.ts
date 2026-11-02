'use server'

import { getDb } from '@/lib/db'
import { enqueueMessage } from '@/lib/queue/message-queue'
import { logger } from '@/lib/logger'

const N8N_BASE_URL = process.env.N8N_BASE_URL
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_EMAIL_WEBHOOK = process.env.N8N_EMAIL_WEBHOOK || 'email'

export interface EmailPayload {
  to: string
  subject: string
  html?: string
  text?: string
  bookingReference?: string
}

/**
 * Intenta enviar email vía n8n webhook. Si falla o no está configurado,
 * encola en outgoing_messages (channel: email) para reintento posterior
 * y que el admin pueda ver/reenviar desde el panel.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; queued?: boolean; error?: string }> {
  const { to, subject, html, text, bookingReference } = payload

  if (N8N_BASE_URL) {
    try {
      const webhookUrl = `${N8N_BASE_URL}/webhook/${N8N_EMAIL_WEBHOOK}`
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_API_KEY ? { Authorization: `Bearer ${N8N_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          event: 'email.send',
          to,
          subject,
          html,
          text,
          bookingReference,
          timestamp: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        logger.info('[Email] sent via n8n', { to, subject, bookingReference })
        return { ok: true }
      }
      logger.warn('[Email] n8n webhook not ok', { status: res.status, to, subject })
    } catch (err) {
      logger.warn('[Email] n8n webhook failed, will queue', { to, subject, error: err instanceof Error ? err.message : String(err) })
    }
  } else {
    logger.warn('[Email] N8N_BASE_URL not configured, queuing email')
  }

  // Fallback: encola para reintento y visibilidad en admin
  try {
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO outgoing_messages (channel, recipient, content, content_type, metadata, status, max_attempts)
            VALUES ('email', ?, ?, 'html', ?, 'pending', 5)`,
      args: [to, subject + '\n\n' + (html || text || ''), JSON.stringify({ subject, bookingReference })],
    })
  } catch (e) {
    logger.error('[Email] failed to queue message', undefined, { error: e instanceof Error ? e.message : String(e) })
  }

  return { ok: false, queued: true, error: 'Email not sent; queued for retry' }
}
