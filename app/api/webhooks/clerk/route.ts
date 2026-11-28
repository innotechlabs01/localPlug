import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { DatabaseClient } from '@lp/db/factory'

type ClerkEvent = {
  type: string
  data: {
    id?: string | null
    email_addresses?: { email_address: string }[]
    first_name?: string | null
    last_name?: string | null
    [key: string]: unknown
  }
}

/** DB role is authoritative: mirror users.role_id into user_roles without removing other grants. */
async function syncUserRoles(
  db: DatabaseClient,
  userId: number,
  roleId: number,
  viewerRoleId: number,
): Promise<void> {
  if (roleId !== viewerRoleId) {
    await db.execute({
      sql: `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
      args: [userId, viewerRoleId],
    })
  }
  await db.execute({
    sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
    args: [userId, roleId],
  })
}

export async function POST(req: NextRequest) {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!signingSecret) {
      console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured — rejecting all webhooks')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let evt: ClerkEvent
    try {
      evt = await verifyWebhook(req, { signingSecret }) as unknown as ClerkEvent
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { id: clerkId, email_addresses, first_name, last_name } = evt.data
    if (!clerkId) {
      return NextResponse.json({ error: 'Missing Clerk user id' }, { status: 400 })
    }

    const db = getDb()
    const email = email_addresses?.[0]?.email_address || ''
    const name = [first_name, last_name].filter(Boolean).join(' ').trim() || email

    // Los nuevos usuarios se registran siempre como viewer. El rol (incluido
    // super_admin/admin) lo configura el Super Admin vía BD/UI; nunca por email.
    const viewerRole = await db.execute({ sql: "SELECT id FROM roles WHERE name = 'viewer' LIMIT 1", args: [] })
    const viewerRoleId = viewerRole.rows[0]?.id || 4

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      // Heal deleted/recreated Clerk accounts: match the new clerk_id to the
      // existing DB row by email so the user keeps role, history and profile.
      const existing = await db.execute({
        sql: `SELECT id, status FROM users
              WHERE clerk_id = ? OR (email <> '' AND LOWER(email) = LOWER(?))
              ORDER BY CASE WHEN clerk_id = ? THEN 0 ELSE 1 END
              LIMIT 1`,
        args: [clerkId, email, clerkId],
      })
      const row = existing.rows[0]

      if (!row) {
        // New user — always viewer by default in DB (Clerk is auth-only, no metadata written)
        await db.execute({
          sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
                VALUES (?, ?, ?, '', ?, 'active', datetime('now'), datetime('now'))`,
          args: [clerkId, name, email, viewerRoleId],
        })

        console.log(`[Clerk Webhook] Created user as viewer in DB: ${email}`)
      } else {
        // Existing user — sync identity only. Role is owned by DB/UI and is never downgraded here.
        const nextStatus = row.status === 'inactive' ? 'active' : row.status
        await db.execute({
          sql: `UPDATE users
                SET clerk_id = ?,
                    name = CASE WHEN ? = '' THEN name ELSE ? END,
                    email = CASE WHEN ? = '' THEN email ELSE ? END,
                    status = ?,
                    updated_at = datetime('now')
                WHERE id = ?`,
          args: [clerkId, name, name, email, email, nextStatus, Number(row.id)],
        })

        console.log(`[Clerk Webhook] Synced user ${clerkId} in DB (role preserved)`)
      }

      // Re-read authoritative role after the upsert: a concurrent admin update
      // may have changed it, and user_roles must follow users.role_id.
      const current = await db.execute({
        sql: `SELECT id, role_id FROM users WHERE clerk_id = ? LIMIT 1`,
        args: [clerkId],
      })
      const currentRow = current.rows[0]
      if (currentRow) {
        await syncUserRoles(
          db,
          Number(currentRow.id),
          Number(currentRow.role_id ?? viewerRoleId),
          Number(viewerRoleId),
        )
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
