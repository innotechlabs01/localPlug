import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { requirePermission } from '@/lib/admin/permissions'

// GET: List all agents (auto-syncing active employees who have support access)
export async function GET(request: Request) {
  try {
    const authError = await requirePermission('support', 'view')
    if (authError) return authError

    const db = getDb()

    // Sync active employees with support permission (or admin/super_admin) into support_agents
    try {
      const staffRes = await db.execute({
        sql: `SELECT DISTINCT u.id, u.name, u.email, u.phone
              FROM users u
              JOIN roles r ON u.role_id = r.id
              LEFT JOIN role_permissions rp ON rp.role_id = r.id
              LEFT JOIN modules m ON m.id = rp.module_id AND m.slug = 'support'
              WHERE u.status = 'active'
                AND u.email IS NOT NULL AND u.email != ''
                AND (r.name IN ('super_admin', 'admin') OR (m.slug = 'support' AND rp.can_view = 1))`,
        args: [],
      })
      for (const staff of staffRes.rows) {
        const staffId = Number(staff.id)
        const staffEmail = String(staff.email || '').trim().toLowerCase()
        const staffName = String(staff.name || staffEmail || 'Support Agent')
        const staffPhone = staff.phone ? String(staff.phone) : null

        const existing = await db.execute({
          sql: `SELECT id, user_id FROM support_agents WHERE user_id = ? OR LOWER(email) = ? LIMIT 1`,
          args: [staffId, staffEmail],
        })
        if (existing.rows.length === 0) {
          await db.execute({
            sql: `INSERT INTO support_agents (user_id, name, email, phone, status, max_conversations)
                  VALUES (?, ?, ?, ?, 'available', 5)`,
            args: [staffId, staffName, staffEmail, staffPhone],
          })
        } else if (!existing.rows[0].user_id) {
          await db.execute({
            sql: `UPDATE support_agents SET user_id = ? WHERE id = ?`,
            args: [staffId, Number(existing.rows[0].id)],
          })
        }
      }
    } catch (syncErr) {
      console.warn('[Chat API] Staff sync warning:', syncErr)
    }

    const result = await db.execute({
      sql: `SELECT
              sa.id, sa.user_id, sa.name, sa.email, sa.phone, sa.status, sa.max_conversations,
              (SELECT COUNT(*) FROM conversations c WHERE c.assigned_agent_id = sa.id AND c.status IN ('human_active', 'ai_active')) as current_conversations,
              sa.specializations, sa.last_active_at, sa.created_at
            FROM support_agents sa
            ORDER BY sa.status = 'available' DESC, sa.name ASC`,
      args: [],
    })

    return NextResponse.json({
      success: true,
      agents: result.rows,
    })
  } catch (error) {
    console.error('[Chat API] List agents error:', error)
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 },
    )
  }
}

// POST: Create or update agent
export async function POST(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's internal ID and role from the database using the clerk_id
    const db = await import('@/lib/db').then(mod => mod.getDb())
    const userResult = await db.execute({
      sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
      args: [userId]
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userIdInternal = userResult.rows[0].id
    const authError = await requirePermission('support', 'create')
    if (authError) return authError

    const body = await request.json()
    const { id, name, email, phone, status, maxConversations, specializations } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 },
      )
    }

    if (id) {
      // Update existing agent
      await db.execute({
        sql: `UPDATE support_agents
              SET name = ?, email = ?, phone = ?, status = ?,
                  max_conversations = ?, specializations = ?,
                  updated_at = datetime('now')
              WHERE id = ?`,
        args: [
          name,
          email,
          phone || null,
          status || 'offline',
          maxConversations || 5,
          specializations ? JSON.stringify(specializations) : null,
          id,
        ],
      })

      return NextResponse.json({ success: true, updated: true })
    } else {
      // Create new agent
      const result = await db.execute({
        sql: `INSERT INTO support_agents (name, email, phone, status, max_conversations, specializations)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          name,
          email,
          phone || null,
          status || 'offline',
          maxConversations || 5,
          specializations ? JSON.stringify(specializations) : null,
        ],
      })

      return NextResponse.json({
        success: true,
        id: Number(result.lastInsertRowid),
      })
    }
  } catch (error) {
    console.error('[Chat API] Create/update agent error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update agent' },
      { status: 500 },
    )
  }
}

// PATCH: Update agent status
export async function PATCH(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's internal ID and role from the database using the clerk_id
    const db = await import('@/lib/db').then(mod => mod.getDb())
    const userResult = await db.execute({
      sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
      args: [userId]
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userIdInternal = userResult.rows[0].id
    const authError = await requirePermission('support', 'create')
    if (authError) return authError

    const body = await request.json()
    const { agentId, status } = body

    if (!agentId || !status) {
      return NextResponse.json(
        { error: 'agentId and status are required' },
        { status: 400 },
      )
    }

    await db.execute({
      sql: `UPDATE support_agents
            SET status = ?, last_active_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ?`,
      args: [status, agentId],
    })

    return NextResponse.json({ success: true, updated: true })
  } catch (error) {
    console.error('[Chat API] Update agent status error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 },
    )
  }
}
