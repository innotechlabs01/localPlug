import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerAiChatMessage, triggerFraudDetection } from '@/lib/n8n/client'
import { generateOllamaResponse } from '@/lib/services/ollama-service'
import { t } from '@/lib/i18n/server'

interface SendMessageRequest {
  conversationId?: number
  message: string
  userIdentifier: string
  userName?: string
  userEmail?: string
  senderType?: 'user' | 'agent'
  agentId?: number
  locale?: string
}

interface MessageRow {
  id: number
  content: string
}

const FRAUD_PATTERNS = [
  /hack|exploit|bypass|inject|sql|script/i,
  /password|credential|secret|token|api.?key/i,
  /credit.?card|ssn|social.?security|bank.?account/i,
  /phish|scam|fake|forgery|counterfeit/i,
]

const BLOCKED_TOPICS = [
  /lost.?item|lost.?baggage|lost.?luggage/i,
  /where.?is|location.?of|address.?of/i,
  /city.?info|tourist.?info|recommendation/i,
  /employee.?personal|worker.?info|staff.?data/i,
  /company.?secret|internal.?info|proprietary/i,
]

function detectFraud(message: string): { isFraud: boolean; reason?: string } {
  for (const pattern of FRAUD_PATTERNS) {
    if (pattern.test(message)) {
      return { isFraud: true, reason: `Suspicious pattern detected: ${pattern.source}` }
    }
  }
  return { isFraud: false }
}

function isBlockedTopic(message: string): { blocked: boolean; topic?: string } {
  for (const pattern of BLOCKED_TOPICS) {
    if (pattern.test(message)) {
      return { blocked: true, topic: pattern.source }
    }
  }
  return { blocked: false }
}

export async function POST(request: Request) {
  try {
    const body: SendMessageRequest = await request.json()
    const { conversationId, message, userIdentifier, userName, userEmail, senderType, agentId, locale } = body

    if (!message || !userIdentifier) {
      return NextResponse.json(
        { error: 'message and userIdentifier are required' },
        { status: 400 },
      )
    }

    const db = getDb()

    if (senderType === 'agent') {
      let convId = conversationId
      if (!convId) {
        const result = await db.execute({
          sql: `INSERT INTO conversations (user_identifier, user_name, user_email, status, channel)
                VALUES (?, ?, ?, 'human_active', 'web')`,
          args: [userIdentifier, userName || null, userEmail || null],
        })
        convId = Number(result.lastInsertRowid)
      }

      await db.execute({
        sql: `INSERT INTO messages (conversation_id, sender_type, sender_id, content, message_type)
              VALUES (?, 'agent', ?, ?, 'text')`,
        args: [convId, agentId ? String(agentId) : 'agent', message],
      })

      await db.execute({
        sql: 'UPDATE conversations SET last_message_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?',
        args: [convId],
      })

      // Track first agent response time for rating stats
      await db.execute({
        sql: `UPDATE conversations SET first_agent_response_at = datetime('now')
              WHERE id = ? AND first_agent_response_at IS NULL`,
        args: [convId],
      })

      return NextResponse.json({
        success: true,
        conversationId: convId,
        response: {
          sender: 'agent',
          content: message,
          type: 'text',
        },
      })
    }

    const blockedCheck = isBlockedTopic(message)
    if (blockedCheck.blocked) {
      return NextResponse.json({
        success: true,
        response: {
          sender: 'ai',
          content: t(locale || 'en', 'chat.blockedTopic'),
          type: 'system',
        },
      })
    }

    const fraudCheck = detectFraud(message)
    if (fraudCheck.isFraud) {
      if (conversationId) {
      await db.execute({
        sql: 'UPDATE conversations SET flagged = 1, flag_reason = ?, updated_at = datetime(\'now\') WHERE id = ?',
        args: [fraudCheck.reason || 'Suspicious pattern detected', conversationId],
      })
      }

      await triggerFraudDetection({
        conversationId: conversationId || 0,
        message,
        userIdentifier,
        flagReason: fraudCheck.reason || 'Suspicious pattern',
      })

      return NextResponse.json({
        success: true,
        response: {
          sender: 'ai',
          content: t(locale || 'en', 'chat.fraudDetected'),
          type: 'system',
        },
      })
    }

    let convId = conversationId
    if (!convId) {
      const result = await db.execute({
        sql: `INSERT INTO conversations (user_identifier, user_name, user_email, status, channel)
              VALUES (?, ?, ?, 'ai_active', 'web')`,
        args: [userIdentifier, userName || null, userEmail || null],
      })
      convId = Number(result.lastInsertRowid)
    }

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, sender_id, content, message_type)
            VALUES (?, 'user', ?, ?, 'text')`,
      args: [convId, userIdentifier, message],
    })

    await db.execute({
      sql: 'UPDATE conversations SET last_message_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?',
      args: [convId],
    })

    // Fetch user profile and booking info for richer AI context
    const convRows = await db.execute({
      sql: `SELECT user_name, user_email, user_phone, user_country, booking_reference
            FROM conversations WHERE id = ?`,
      args: [convId],
    })
    const conv = convRows.rows[0] as { user_name?: string; user_email?: string; user_phone?: string; user_country?: string; booking_reference?: string } | undefined

    // Fetch conversation history (last 10 messages)
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
          orderNumber: b.order_number,
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

    const n8nResult = await triggerAiChatMessage({
      conversationId: convId,
      message,
      userIdentifier,
      userName: conv?.user_name || userName,
      userEmail: conv?.user_email,
      userPhone: conv?.user_phone,
      userCountry: conv?.user_country,
      bookingInfo,
      conversationHistory: history,
    })

    if (n8nResult.success) {
      console.log('[Chat Send] n8n AI chat message webhook sent successfully', { conversationId: convId })

      const N8N_SYSTEM_MSGS = ['workflow was started', 'workflow execution started', 'workflow triggered', 'webhook received']
      const isN8nSystem = n8nResult.message && N8N_SYSTEM_MSGS.some(s => n8nResult.message?.toLowerCase().includes(s))

      if (n8nResult.message && !isN8nSystem) {
        console.log('[Chat Send] n8n returned AI response directly', { conversationId: convId, message: n8nResult.message.slice(0, 200) })

        await db.execute({
          sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
                VALUES (?, 'ai', ?, 'text', ?)`,
          args: [convId, n8nResult.message, JSON.stringify({ confidence: n8nResult.confidence, source: 'n8n-direct' })],
        })

        await db.execute({
          sql: `UPDATE conversations SET ai_confidence = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
          args: [n8nResult.confidence || 1.0, convId],
        })

        if (n8nResult.confidence && n8nResult.confidence < 0.5) {
          await db.execute({
            sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now')
                  WHERE id = ? AND status = 'ai_active'`,
            args: [convId],
          })
        }

        return NextResponse.json({
          success: true,
          conversationId: convId,
          response: {
            sender: 'ai',
            content: n8nResult.message,
            type: 'text',
          },
          n8nTriggered: true,
        })
      }

      console.log('[Chat Send] n8n processing async — n8n will write response to DB via POST /api/chat/ai-response, polling will pick it up', { conversationId: convId })

      return NextResponse.json({
        success: true,
        conversationId: convId,
        pending: true,
        n8nTriggered: true,
      })
    }

    console.warn('[Chat Send] n8n webhook failed, trying Ollama fallback', {
      conversationId: convId,
      error: n8nResult.error,
    })

    const ollamaResult = await generateOllamaResponse({
      message,
      conversationHistory: history,
      bookingInfo,
      userCountry: conv?.user_country,
    })

    if (ollamaResult.message) {
      console.log('[Chat Send] Ollama fallback response generated', { conversationId: convId, message: ollamaResult.message.slice(0, 200) })

      await db.execute({
        sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
              VALUES (?, 'ai', ?, 'text', ?)`,
        args: [convId, ollamaResult.message, JSON.stringify({ confidence: ollamaResult.confidence, source: 'ollama' })],
      })

      await db.execute({
        sql: `UPDATE conversations SET ai_confidence = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        args: [ollamaResult.confidence, convId],
      })

      if (ollamaResult.confidence < 0.5) {
        await db.execute({
          sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now')
                WHERE id = ? AND status = 'ai_active'`,
          args: [convId],
        })
      }

      await db.execute({
        sql: `UPDATE conversations SET first_agent_response_at = datetime('now')
              WHERE id = ? AND first_agent_response_at IS NULL`,
        args: [convId],
      })

      return NextResponse.json({
        success: true,
        conversationId: convId,
        response: {
          sender: 'ai',
          content: ollamaResult.message,
          type: 'text',
        },
        n8nTriggered: false,
        source: 'ollama',
      })
    }

    console.warn('[Chat Send] Ollama fallback also failed, using localized fallback', {
      conversationId: convId,
    })

    const fallbackContent = t(locale || 'en', 'chat.fallback')

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'ai', ?, 'text')`,
      args: [convId, fallbackContent],
    })

    await db.execute({
      sql: `UPDATE conversations SET first_agent_response_at = datetime('now')
            WHERE id = ? AND first_agent_response_at IS NULL`,
      args: [convId],
    })

    return NextResponse.json({
      success: true,
      conversationId: convId,
      response: {
        sender: 'ai',
        content: fallbackContent,
        type: 'text',
      },
      n8nTriggered: false,
      source: 'fallback',
    })
  } catch (error) {
    console.error('[Chat API] Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    )
  }
}
