import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET: List all agents
export async function GET() {
  try {
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
    const body = await request.json()
    const { id, name, email, phone, status, maxConversations, specializations } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 },
      )
    }

    const db = getDb()

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
    const body = await request.json()
    const { agentId, status } = body

    if (!agentId || !status) {
      return NextResponse.json(
        { error: 'agentId and status are required' },
        { status: 400 },
      )
    }

    const db = getDb()

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
