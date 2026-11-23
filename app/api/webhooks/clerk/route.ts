import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || ''
const CLERK_API_URL = 'https://api.clerk.com/v1'

async function setClerkMetadata(clerkId: string, metadata: Record<string, unknown>) {
  if (!CLERK_SECRET_KEY) return
  try {
    await fetch(`${CLERK_API_URL}/users/${clerkId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ private_metadata: metadata }),
    })
  } catch (e) {
    console.error('[Clerk Webhook] Failed to set metadata:', e)
  }
}

type ClerkEvent = {
  type: string
  data: {
    id: string
    email_addresses?: { email_address: string }[]
    first_name?: string | null
    last_name?: string | null
    public_metadata?: Record<string, unknown>
    private_metadata?: Record<string, unknown>
    [key: string]: unknown
  }
}

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(req: Request) {
  try {
    if (!CLERK_WEBHOOK_SECRET) {
      console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured — rejecting all webhooks')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const headerPayload = await headers()
    const svixId = headerPayload.get('svix-id')
    const svixTimestamp = headerPayload.get('svix-timestamp')
    const svixSignature = headerPayload.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
    }

    const body = await req.text()

    let evt: ClerkEvent
    try {
      const wh = new Webhook(CLERK_WEBHOOK_SECRET)
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkEvent
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const db = getDb()
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses?.[0]?.email_address || ''
    const name = [first_name, last_name].filter(Boolean).join(' ').trim() || email

    const adminRole = await db.execute({ sql: "SELECT id FROM roles WHERE name = 'admin' LIMIT 1", args: [] })
    const adminRoleId = adminRole.rows[0]?.id || 1
    const viewerRole = await db.execute({ sql: "SELECT id FROM roles WHERE name = 'viewer' LIMIT 1", args: [] })
    const viewerRoleId = viewerRole.rows[0]?.id || 4

    const isAdmin = isAdminEmail(email)

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const existing = await db.execute({
        sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
        args: [clerkId],
      })

      if (existing.rows.length === 0) {
        // New user — assign admin if email matches, otherwise viewer
        const roleId = isAdmin ? adminRoleId : viewerRoleId

        await db.execute({
          sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
                VALUES (?, ?, ?, '', ?, 'active', datetime('now'), datetime('now'))`,
          args: [clerkId, name, email, roleId],
        })

        // Sync role into Clerk metadata
        await setClerkMetadata(clerkId, { role: isAdmin ? 'admin' : 'viewer' })

        console.log(`[Clerk Webhook] Created user ${isAdmin ? 'ADMIN' : 'viewer'}: ${email}`)
      } else {
        // Existing user — update info and promote to admin if email matches ADMIN_EMAILS
        const currentRoleId = existing.rows[0].role_id as number
        const targetRoleId = isAdmin ? adminRoleId : currentRoleId

        if (isAdmin && currentRoleId !== adminRoleId) {
          await db.execute({
            sql: `UPDATE users SET name = ?, email = ?, role_id = ?, updated_at = datetime('now') WHERE clerk_id = ?`,
            args: [name, email, adminRoleId, clerkId],
          })
          await setClerkMetadata(clerkId, { role: 'admin' })
          console.log(`[Clerk Webhook] Promoted user to ADMIN: ${email}`)
        } else {
          await db.execute({
            sql: `UPDATE users SET name = ?, email = ?, updated_at = datetime('now') WHERE clerk_id = ?`,
            args: [name, email, clerkId],
          })
        }
      }
    }

    if (evt.type === 'user.deleted') {
      await db.execute({
        sql: `UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE clerk_id = ?`,
        args: [clerkId],
      })
      console.log(`[Clerk Webhook] Deactivated user`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Clerk Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
