import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerAiChatMessage } from '@/lib/n8n/client'
import { t } from '@/lib/i18n/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, country, countryCode, locale } = body

    if (!name || !email || !phone || !country || !countryCode) {
      return NextResponse.json(
        { error: 'name, email, phone, country, and countryCode are required' },
        { status: 400 },
      )
    }

    const db = getDb()
    const sessionId = 'ses_' + Math.random().toString(36).slice(2, 15) + Date.now().toString(36)

    const result = await db.execute({
      sql: `INSERT INTO conversations (user_identifier, user_name, user_email, user_phone, user_country, country_code, status, channel)
            VALUES (?, ?, ?, ?, ?, ?, 'ai_active', 'web')`,
      args: [email, name, email, phone, country, countryCode],
    })

    const conversationId = Number(result.lastInsertRowid)

    // Send welcome AI message
    const welcomeContent = t(locale || 'en', 'chatWidget.startMessage')

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'ai', ?, 'text')`,
      args: [conversationId, welcomeContent],
    })

    await db.execute({
      sql: "UPDATE conversations SET last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [conversationId],
    })

    await triggerAiChatMessage({
      conversationId,
      message: `New conversation started by ${name} (${email})`,
      userIdentifier: email,
      userName: name,
      userEmail: email,
      userPhone: phone,
      userCountry: country,
    })

    return NextResponse.json({
      success: true,
      conversationId,
      sessionId,
    })
  } catch (error) {
    console.error('[Chat Start] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 },
    )
  }
}