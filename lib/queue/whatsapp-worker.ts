import { dequeuePendingMessages, markMessageSent, markMessageFailed } from './message-queue'
import { sendWhatsAppDirect, sendWhatsAppButtons, sendN8nWebhook } from '@/lib/n8n/client'
import { isCircuitOpen } from '@/lib/resilience/circuit-breaker'
import { logger } from '@/lib/logger'

const MIN_DELAY_MS = 3000
const MAX_DELAY_MS = 8000

function randomDelay(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
}

export async function processQueue(batchSize = 10): Promise<{ processed: number; failed: number }> {
  let processed = 0
  let failed = 0

  const messages = await dequeuePendingMessages(batchSize)

  for (const msg of messages) {
    try {
      if (msg.channel === 'whatsapp') {
        if (isCircuitOpen('evolution-whatsapp')) {
          await markMessageFailed(msg.id, 'Circuit open - retry later')
          failed++
          continue
        }

        let result
        if (msg.content_type === 'buttons') {
          const meta = msg.metadata as { title?: string; description?: string; buttons?: Array<{ id: string; text: string }> } | undefined
          result = await sendWhatsAppButtons({
            number: msg.recipient,
            title: meta?.title || msg.content,
            description: meta?.description || '',
            buttons: meta?.buttons || [],
          })
        } else {
          result = await sendWhatsAppDirect({
            number: msg.recipient,
            message: msg.content,
          })
        }

        if (result.success) {
          await markMessageSent(msg.id)
          processed++
        } else {
          await markMessageFailed(msg.id, result.error || 'Unknown error')
          failed++
        }
      } else if (msg.channel === 'n8n') {
        const data = JSON.parse(msg.content)
        const result = await sendN8nWebhook(msg.recipient, data)

        if (result.success) {
          await markMessageSent(msg.id)
          processed++
        } else {
          await markMessageFailed(msg.id, result.error || 'Unknown error')
          failed++
        }
      }

      if (processed + failed < messages.length) {
        await new Promise(resolve => setTimeout(resolve, randomDelay()))
      }
    } catch (err) {
      logger.error('Queue worker: process failed', err instanceof Error ? err : undefined, { messageId: msg.id })
      await markMessageFailed(msg.id, err instanceof Error ? err.message : String(err))
      failed++
    }
  }

  if (processed > 0 || failed > 0) {
    logger.info('Queue worker: batch complete', { processed, failed })
  }

  return { processed, failed }
}
