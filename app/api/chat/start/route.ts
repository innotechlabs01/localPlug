import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerAiChatMessage } from '@/lib/n8n/client'
import { t } from '@/lib/i18n/server'
import { getCountryByCode, getCountryByDialCode } from '@/lib/countries'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, country, countryCode, locale } = body

    // Validate required fields
    if (!name || !email || !phone || !country || !countryCode) {
      return NextResponse.json(
        { error: 'name, email, phone, country, and countryCode are required' },
        { status: 400 },
      )
    }

    // Validate phone is non-empty string
    const sanitizedPhone = String(phone).trim()
    if (!sanitizedPhone) {
      return NextResponse.json(
        { error: 'phone must be a non-empty string' },
        { status: 400 },
      )
    }

    // Validate country code exists
    const countryData = getCountryByCode(country)
    if (!countryData) {
      return NextResponse.json(
        { error: `Invalid country code: ${country}` },
        { status: 400 },
      )
    }

    // Validate country dial code (getCountryByDialCode handles normalization)
    const dialCodeData = getCountryByDialCode(countryCode)
    if (!dialCodeData) {
      return NextResponse.json(
        { error: `Invalid country dial code: ${countryCode}` },
        { status: 400 },
      )
    }

    const db = getDb()

    // Generate session ID for this conversation
    const sessionId = 'ses_' + Math.random().toString(36).slice(2, 15) + Date.now().toString(36)

    // Insert conversation with status 'pending' (awaiting admin pickup)
    const result = await db.execute({
      sql: `INSERT INTO conversations (user_identifier, user_name, user_email, user_phone, user_country, country_code, status, channel)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', 'web')`,
      args: [email, name, email, sanitizedPhone, country, countryCode],
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

    // Trigger n8n AI for ongoing conversation
    await triggerAiChatMessage({
      conversationId,
      message: `New conversation started by ${name} (${email})`,
      userIdentifier: email,
      userName: name,
    })

    // Get the created_at timestamp for response
    const convResult = await db.execute({
      sql: 'SELECT created_at FROM conversations WHERE id = ?',
      args: [conversationId],
    })

    const createdAt = convResult.rows.length > 0 
      ? ((convResult.rows[0] as unknown) as { created_at: string }).created_at
      : new Date().toISOString()

    return NextResponse.json({
      success: true,
      conversationId,
      sessionId,
      createdAt,
    })
  } catch (error) {
    console.error('[Chat Start] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 },
    )
  }
}
