import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface N8nWebhookEvent {
  event: string
  data: Record<string, unknown>
  timestamp: string
}

/**
 * Handle incoming webhooks from n8n
 * This endpoint receives workflow results and updates the app accordingly
 */
export async function POST(request: Request) {
  try {
    const body: N8nWebhookEvent = await request.json()
    const { event, data, timestamp } = body

    console.log(`[n8n Webhook] Received event: ${event}`, { timestamp })

    const db = getDb()

    console.log(`[n8n Webhook] Processing event: ${event}`, {
      timestamp,
      event,
      dataKeys: Object.keys(data),
    })

    switch (event) {
      case 'ai-chat-response': {
        const { conversationId, message, confidence } = data as {
          conversationId: number
          message: string
          confidence: number
        }

        console.log('[n8n Webhook] ai-chat-response received', {
          conversationId,
          messageLength: message?.length,
          confidence,
          timestamp,
        })

        if (conversationId && message) {
          await db.execute({
            sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
                  VALUES (?, 'ai', ?, 'text', ?)`,
            args: [conversationId, message, JSON.stringify({ confidence, source: 'n8n' })],
          })

          await db.execute({
            sql: `UPDATE conversations SET ai_confidence = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [confidence || 1.0, conversationId],
          })

          if (confidence && confidence < 0.5) {
            await db.execute({
              sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now') WHERE id = ? AND status = 'ai_active'`,
              args: [conversationId],
            })
          }
        }
        break
      }

      case 'payment-confirmed': {
        const { bookingReference, customerEmail, customerName } = data as {
          bookingReference: string
          customerEmail: string
          customerName: string
        }

        if (bookingReference && customerEmail) {
          const existing = await db.execute({
            sql: `SELECT id FROM conversations WHERE booking_reference = ?`,
            args: [bookingReference],
          })

          if (existing.rows.length === 0) {
            await db.execute({
              sql: `INSERT INTO conversations (user_identifier, user_name, user_email, status, booking_reference, channel)
                    VALUES (?, ?, ?, 'ai_active', ?, 'n8n')`,
              args: [customerEmail, customerName, customerEmail, bookingReference],
            })
          }
        }
        break
      }

      case 'escalation-complete': {
        const { conversationId: convId, assignedAgentId } = data as {
          conversationId: number
          assignedAgentId: number
        }

        if (convId && assignedAgentId) {
          await db.execute({
            sql: `UPDATE conversations
                  SET status = 'human_active', assigned_agent_id = ?, assigned_at = datetime('now'), updated_at = datetime('now')
                  WHERE id = ?`,
            args: [assignedAgentId, convId],
          })
        }
        break
      }

      case 'fraud-alert': {
        const { conversationId: fraudConvId, reason } = data as {
          conversationId: number
          reason: string
        }

        if (fraudConvId) {
          await db.execute({
            sql: `UPDATE conversations SET flagged = 1, flag_reason = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [reason || 'Flagged by AI', fraudConvId],
          })
        }
        break
      }

      case 'driver-assigned': {
        const { bookingReference: daBookingRef, whatsappMessageId, whatsappStatus } = data as {
          bookingReference: string
          whatsappMessageId: string
          whatsappStatus: string
        }

        console.log('[n8n Webhook] driver-assigned callback', {
          bookingReference: daBookingRef,
          whatsappMessageId,
          whatsappStatus,
        })

        // Store WhatsApp event
        if (daBookingRef && whatsappMessageId) {
          await db.execute({
            sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, message_id, from_me, content, status, raw_payload)
                  VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
            args: [
              'driver-assigned',
              'n8n',
              daBookingRef,
              whatsappMessageId,
              'Driver assigned notification',
              whatsappStatus || 'sent',
              JSON.stringify(data),
            ],
          })
        }
        break
      }

      case 'delivery-completed': {
        const { bookingReference: dcBookingRef, whatsappMessageId: dcMsgId, whatsappStatus: dcStatus } = data as {
          bookingReference: string
          whatsappMessageId: string
          whatsappStatus: string
        }

        console.log('[n8n Webhook] delivery-completed callback', {
          bookingReference: dcBookingRef,
          whatsappMessageId: dcMsgId,
          whatsappStatus: dcStatus,
        })

        // Store WhatsApp event
        if (dcBookingRef && dcMsgId) {
          await db.execute({
            sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, message_id, from_me, content, status, raw_payload)
                  VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
            args: [
              'delivery-completed',
              'n8n',
              dcBookingRef,
              dcMsgId,
              'Delivery completed notification',
              dcStatus || 'sent',
              JSON.stringify(data),
            ],
          })
        }
        break
      }

      case 'whatsapp-escalation': {
        const { conversationId: escConvId, reason: escReason, phone } = data as {
          conversationId: number
          reason: string
          phone: string
        }

        if (escConvId) {
          await db.execute({
            sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now') WHERE id = ?`,
            args: [escConvId],
          })

          // Store escalation message
          await db.execute({
            sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
                  VALUES (?, 'system', ?, 'escalation', ?)`,
            args: [escConvId, `Auto-escalated: ${escReason || 'Keywords detected'}`, JSON.stringify({ source: 'whatsapp', phone })],
          })
        }
        break
      }

      case 'whatsapp-ai-response': {
        const { conversationId: aiConvId, message: aiMsg, confidence: aiConf } = data as {
          conversationId: number
          message: string
          confidence: number
        }

        if (aiConvId && aiMsg) {
          await db.execute({
            sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
                  VALUES (?, 'ai', ?, 'text', ?)`,
            args: [aiConvId, aiMsg, JSON.stringify({ confidence: aiConf, source: 'n8n-whatsapp' })],
          })

          await db.execute({
            sql: `UPDATE conversations SET ai_confidence = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
            args: [aiConf || 1.0, aiConvId],
          })
        }
        break
      }

      case 'whatsapp-sent': {
        const { conversationId: sentConvId, whatsappMessageId: sentMsgId, status: sentStatus } = data as {
          conversationId: number
          whatsappMessageId: string
          status: string
        }

        if (sentConvId && sentMsgId) {
          await db.execute({
            sql: `INSERT INTO whatsapp_events (event_type, instance_name, remote_jid, message_id, from_me, status, conversation_id, raw_payload)
                  VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
            args: [
              'message.sent',
              'app',
              '',
              sentMsgId,
              sentStatus || 'sent',
              sentConvId,
              JSON.stringify(data),
            ],
          })
        }
        break
      }

      default:
        console.log(`[n8n Webhook] Unknown event: ${event}`)
    }

    return NextResponse.json({ success: true, processed: event })
  } catch (error) {
    console.error('[n8n Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}

// Verify n8n webhook signature (optional security)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'n8n-webhook',
    timestamp: new Date().toISOString(),
  })
}
