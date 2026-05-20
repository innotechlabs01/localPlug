import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerAiChatMessage } from '@/lib/n8n/client'

interface EvolutionEvent {
  event: string
  instance: string
  data: Record<string, unknown>
}

interface EvolutionMessage {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string
    extendedTextMessage?: { text?: string }
    imageMessage?: { caption?: string }
    videoMessage?: { caption?: string }
    documentMessage?: { fileName?: string }
  }
  pushName?: string
  messageTimestamp?: number
  participant?: string
}

function extractMessageText(msg: EvolutionMessage): string | null {
  if (msg.message?.conversation) return msg.message.conversation
  if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text
  if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption
  if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption
  return null
}

function normalizePhone(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@lid$/, '')
}

export async function POST(req: Request) {
  try {
    const body: EvolutionEvent = await req.json()
    const { event, instance, data } = body

    console.log(`[Evolution Webhook] Received: ${event}`, { instance })

    const db = getDb()

    switch (event) {
      case 'messages.upsert': {
        const msg = data as unknown as EvolutionMessage
        if (!msg.key) break

        const phone = normalizePhone(msg.key.remoteJid)
        const fromMe = msg.key.fromMe
        const messageId = msg.key.id
        const text = extractMessageText(msg)
        const participant = msg.participant || null

        // Only process incoming messages (not from us)
        if (fromMe) {
          // Log outbound message for tracking
          await db.execute({
            sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, message_id, from_me, content, message_type, participant, raw_payload)
                  VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
            args: [
              'message.upsert',
              instance,
              phone,
              messageId,
              text || '',
              msg.message?.conversation ? 'conversation' : 'other',
              participant,
              JSON.stringify(msg),
            ],
          })
          break
        }

        // Log incoming message
        await db.execute({
          sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, message_id, from_me, content, message_type, participant, raw_payload)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
          args: [
            'message.upsert',
            instance,
            phone,
            messageId,
            text || '',
            msg.message?.conversation ? 'conversation' : 'other',
            participant,
            JSON.stringify(msg),
          ],
        })

        if (!text) break

        // Find or create conversation for this phone number
        const existing = await db.execute({
          sql: `SELECT id, status FROM conversations WHERE user_identifier = ? AND channel = 'whatsapp' ORDER BY created_at DESC LIMIT 1`,
          args: [phone],
        })

        let convId: number

        if (existing.rows.length > 0) {
          convId = existing.rows[0].id as number
          const status = existing.rows[0].status as string

          // If admin has control (human_active), don't trigger AI
          if (status === 'human_active') {
            console.log(`[Evolution Webhook] Conversation ${convId} is human-controlled, skipping AI`)
            break
          }

          // Update conversation
          await db.execute({
            sql: `UPDATE conversations SET last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
            args: [convId],
          })
        } else {
          // Create new conversation from WhatsApp
          const result = await db.execute({
            sql: `INSERT INTO conversations (user_identifier, user_name, status, channel, whatsapp_instance, whatsapp_message_id)
                  VALUES (?, ?, 'ai_active', 'whatsapp', ?, ?)`,
            args: [phone, msg.pushName || phone, instance, messageId],
          })
          convId = Number(result.lastInsertRowid)
        }

        // Store incoming message
        await db.execute({
          sql: `INSERT INTO messages (conversation_id, sender_type, sender_id, content, message_type, metadata)
                VALUES (?, 'user', ?, ?, 'text', ?)`,
          args: [convId, phone, text, JSON.stringify({ source: 'whatsapp', instance, messageId })],
        })

        // Trigger n8n AI processing (only if conversation is ai_active)
        const convStatus = await db.execute({
          sql: `SELECT status FROM conversations WHERE id = ?`,
          args: [convId],
        })

        if (convStatus.rows[0]?.status === 'ai_active') {
          await triggerAiChatMessage({
            conversationId: convId,
            message: text,
            userIdentifier: phone,
            userName: msg.pushName || undefined,
          })
        }

        break
      }

      case 'message-receipt.update': {
        const receipt = data as {
          key?: { remoteJid?: string; id?: string }
          status?: string
        }
        if (receipt.key?.id) {
          await db.execute({
            sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, message_id, from_me, status, raw_payload)
                  VALUES (?, ?, ?, ?, 0, ?, ?)`,
            args: [
              'message-receipt.update',
              instance,
              normalizePhone(receipt.key.remoteJid || ''),
              receipt.key.id,
              receipt.status || 'unknown',
              JSON.stringify(data),
            ],
          })
        }
        break
      }

      case 'instance.status': {
        const statusData = data as { instanceName?: string; status?: string }
        console.log(`[Evolution Webhook] Instance status:`, statusData)
        await db.execute({
          sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, content, raw_payload)
                VALUES (?, ?, 'system', ?, ?)`,
          args: [
            'instance.status',
            instance,
            JSON.stringify(statusData.status || 'unknown'),
            JSON.stringify(data),
          ],
        })
        break
      }

      case 'connection.update': {
        const connData = data as { state?: string; reason?: string }
        console.log(`[Evolution Webhook] Connection update:`, connData)
        await db.execute({
          sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, content, raw_payload)
                VALUES (?, ?, 'system', ?, ?)`,
          args: [
            'connection.update',
            instance,
            JSON.stringify(connData.state || 'unknown'),
            JSON.stringify(data),
          ],
        })
        break
      }

      default:
        console.log(`[Evolution Webhook] Unhandled event: ${event}`)
    }

    return NextResponse.json({ success: true, processed: event })
  } catch (error) {
    console.error('[Evolution Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'evolution-webhook',
    timestamp: new Date().toISOString(),
  })
}
