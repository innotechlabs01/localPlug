import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendWhatsAppDirect, sendOrQueueWhatsApp } from '@/lib/n8n/client'
import { generateOpenAIResponse } from '@/lib/services/openai-service'
import { generateOllamaResponse } from '@/lib/services/ollama-service'
import { timingSafeEqual } from '@/lib/string-utils'

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
    const signature = req.headers.get('x-evolution-signature')
    const secret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (!signature || !secret || !timingSafeEqual(signature, secret)) {
      console.error('[Evolution Webhook] Invalid or missing signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body: EvolutionEvent = await req.json()
    const { event, instance, data } = body

    if (!instance || !/^[a-zA-Z0-9_-]{1,50}$/.test(instance)) {
      console.error('[Evolution Webhook] Invalid instance name')
      return NextResponse.json({ error: 'Invalid instance' }, { status: 400 })
    }

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

        // Process with AI and respond via Evolution API (only if conversation is ai_active)
        const convStatus = await db.execute({
          sql: `SELECT status, user_name, booking_reference FROM conversations WHERE id = ?`,
          args: [convId],
        })

        if (convStatus.rows[0]?.status === 'ai_active') {
          // Fetch conversation history for AI context
          const historyRows = await db.execute({
            sql: `SELECT sender_type, content FROM messages
                  WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 10`,
            args: [convId],
          })
          const history = (historyRows.rows as unknown as Array<{ sender_type: string; content: string }>).map(m => ({
            role: m.sender_type === 'user' ? 'user' : 'assistant',
            content: m.content,
          }))

          // Fetch booking info if available
          const conv = convStatus.rows[0] as { user_name?: string; booking_reference?: string }
          let bookingInfo: Record<string, unknown> | null = null
          if (conv?.booking_reference) {
            const bookingRows = await db.execute({
              sql: `SELECT order_number, customer_name, package_name, airline, flight_number,
                           arrival_date, arrival_time, destination_address, status
                    FROM orders WHERE booking_reference = ? LIMIT 1`,
              args: [conv.booking_reference],
            })
            if (bookingRows.rows.length > 0) {
              const b = bookingRows.rows[0] as Record<string, unknown>
              bookingInfo = {
                reference: b.booking_reference || conv.booking_reference,
                packageName: b.package_name,
                airline: b.airline,
                flight: b.flight_number,
                arrivalDate: b.arrival_date,
                arrivalTime: b.arrival_time,
                destination: b.destination_address,
                status: b.status,
              }
            }
          }

          // Generate AI response — NVIDIA NIM cloud first (fast, free tier), Ollama local fallback
          const aiContext = {
            message: text,
            conversationHistory: history,
            bookingInfo,
          }
          let aiResult = await generateOpenAIResponse(aiContext)
          if (!aiResult.message) {
            console.warn('[Evolution Webhook] NVIDIA NIM unavailable, trying Ollama fallback')
            aiResult = await generateOllamaResponse(aiContext)
          }

          if (aiResult.message) {
            // Check for escalation (low confidence means escalation detected in openai-service)
            const isEscalation = aiResult.confidence < 0.5

            if (isEscalation) {
              // Set conversation to human_active
              await db.execute({
                sql: `UPDATE conversations SET status = 'human_active', updated_at = datetime('now')
                      WHERE id = ? AND status = 'ai_active'`,
                args: [convId],
              })

              // Send escalation message to user
              const escalationMsg = 'Un agente se pondrá en contacto contigo en breve. ⏳'
              await sendWhatsAppDirect({
                number: phone,
                message: escalationMsg,
              })

              // Store escalation message
              await db.execute({
                sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
                      VALUES (?, 'system', ?, 'escalation', ?)`,
                args: [convId, escalationMsg, JSON.stringify({ source: 'whatsapp-escalation', confidence: aiResult.confidence })],
              })
            } else {
              // Send normal AI response via Evolution API
              await sendWhatsAppDirect({
                number: phone,
                message: aiResult.message,
              })

              // Store AI response
              await db.execute({
                sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
                      VALUES (?, 'ai', ?, 'text', ?)`,
                args: [convId, aiResult.message, JSON.stringify({ confidence: aiResult.confidence, source: 'whatsapp-ai' })],
              })

              // Update AI confidence
              await db.execute({
                sql: `UPDATE conversations SET ai_confidence = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
                args: [aiResult.confidence, convId],
              })
            }
          } else {
            // AI failed, send fallback message
            const fallbackMsg = 'Gracias por tu mensaje. Un agente se pondrá en contacto contigo pronto. 🙏'
            await sendWhatsAppDirect({
              number: phone,
              message: fallbackMsg,
            })

            await db.execute({
              sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
                    VALUES (?, 'system', ?, 'text')`,
              args: [convId, fallbackMsg],
            })
          }
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


