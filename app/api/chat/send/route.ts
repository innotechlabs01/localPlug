import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerAiChatMessage, triggerFraudDetection } from '@/lib/n8n/client'
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

    const n8nResult = await triggerAiChatMessage({
      conversationId: convId,
      message,
      userIdentifier,
      userName,
    })

    if (n8nResult.success) {
      console.log('[Chat Send] n8n AI chat message webhook sent successfully', { conversationId: convId })

      return NextResponse.json({
        success: true,
        conversationId: convId,
        response: null,
        n8nTriggered: true,
      })
    }

    console.warn('[Chat Send] n8n webhook failed, using localized fallback', {
      conversationId: convId,
      error: n8nResult.error,
    })

    const fallbackContent = t(locale || 'en', 'chat.fallback')

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'ai', ?, 'text')`,
      args: [convId, fallbackContent],
    })

    // Track first AI response time for rating stats
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
    })
  } catch (error) {
    console.error('[Chat API] Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    )
  }
}
