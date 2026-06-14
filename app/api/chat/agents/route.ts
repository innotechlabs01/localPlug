import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// GET: List all agents
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `SELECT
              id, name, email, phone, status, max_conversations,
              current_conversations, specializations, last_active_at, created_at
            FROM support_agents
            ORDER BY name ASC`,
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
    const roleId = userResult.rows[0].role_id

    // Check if the user is an agent/admin (has a role_id assigned)
    if (roleId === null) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      )
    }

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
    const roleId = userResult.rows[0].role_id

    // Check if the user is an agent/admin (has a role_id assigned)
    if (roleId === null) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      )
    }

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
