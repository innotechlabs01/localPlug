import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || ''
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
      body: JSON.stringify({ public_metadata: metadata }),
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
    [key: string]: unknown
  }
}

export async function POST(req: Request) {
  try {
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

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE clerk_id = ?',
        args: [clerkId],
      })

      if (existing.rows.length === 0) {
        // Check if user already has a role in Clerk metadata (e.g. admin-created driver/manager)
        const incomingRole = (evt.data.public_metadata?.role as string) || ''

        if (incomingRole && ['admin', 'hotel_manager', 'driver'].includes(incomingRole)) {
          // User was created by admin API with a specific role — preserve it
          // Map Clerk role to local DB role
          const roleMap: Record<string, string> = {
            admin: 'admin',
            hotel_manager: 'hotel_manager',
            driver: 'driver',
          }
          const dbRoleName = roleMap[incomingRole] || 'viewer'
          const roles = await db.execute({ sql: 'SELECT id FROM roles WHERE name = ?', args: [dbRoleName] })
          const roleId = roles.rows[0]?.id || 4

          await db.execute({
            sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
                  VALUES (?, ?, ?, '', ?, 'active', datetime('now'), datetime('now'))`,
            args: [clerkId, name, email, roleId],
          })

          console.log(`[Clerk Webhook] Created user as ${incomingRole}`)
        } else {
          // Self-registered user — default to viewer
          const roles = await db.execute("SELECT id FROM roles WHERE name = 'viewer'")
          const viewerRoleId = roles.rows[0]?.id || 4

          await db.execute({
            sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
                  VALUES (?, ?, ?, '', ?, 'active', datetime('now'), datetime('now'))`,
            args: [clerkId, name, email, viewerRoleId],
          })

          // Only set viewer role if no role was already set
          if (!incomingRole) {
            await setClerkMetadata(clerkId, { role: 'viewer' })
          }

          console.log(`[Clerk Webhook] Created viewer user`)
        }
      } else {
        // Update existing user info
        await db.execute({
          sql: `UPDATE users SET name = ?, email = ?, updated_at = datetime('now') WHERE clerk_id = ?`,
          args: [name, email, clerkId],
        })
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
