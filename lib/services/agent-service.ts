import { getDb } from '@/lib/db'

interface SupportAgent {
  id: number
  user_id: number | null
  name: string
  email: string
  phone: string | null
  status: string
  max_conversations: number
  current_conversations: number
  specializations: string | null
  last_active_at: string | null
}

export async function findAvailableAgent(topic?: string): Promise<SupportAgent | null> {
  const db = getDb()

  const candidates = await db.execute({
    sql: `
      SELECT * FROM support_agents
      WHERE status = 'available'
        AND current_conversations < max_conversations
      ORDER BY current_conversations ASC
    `,
  })

  if (candidates.rows.length === 0) return null

  const agents = candidates.rows as unknown as SupportAgent[]

  if (topic) {
    const lowerTopic = topic.toLowerCase()
    const specialized = agents.filter(a => {
      if (!a.specializations) return false
      try {
        const specs = JSON.parse(a.specializations) as string[]
        return specs.some(s => s.toLowerCase().includes(lowerTopic))
      } catch {
        return false
      }
    })
    if (specialized.length > 0) return specialized[0]
  }

  return agents[0]
}

export async function incrementAgentLoad(agentId: number): Promise<void> {
  const db = getDb()

  const agent = await db.execute({
    sql: 'SELECT current_conversations, max_conversations FROM support_agents WHERE id = ?',
    args: [agentId],
  })

  if (agent.rows.length === 0) return

  const current = Number(agent.rows[0].current_conversations)
  const max = Number(agent.rows[0].max_conversations)
  const newCount = current + 1
  const newStatus = newCount >= max ? 'busy' : 'available'

  await db.execute({
    sql: `
      UPDATE support_agents
      SET current_conversations = ?, status = ?, last_active_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [newCount, newStatus, agentId],
  })
}

export async function decrementAgentLoad(agentId: number): Promise<void> {
  const db = getDb()

  const agent = await db.execute({
    sql: 'SELECT current_conversations, max_conversations FROM support_agents WHERE id = ?',
    args: [agentId],
  })

  if (agent.rows.length === 0) return

  const current = Number(agent.rows[0].current_conversations)
  const max = Number(agent.rows[0].max_conversations)
  const newCount = Math.max(0, current - 1)
  const newStatus = newCount >= max ? 'busy' : 'available'

  await db.execute({
    sql: `
      UPDATE support_agents
      SET current_conversations = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [newCount, newStatus, agentId],
  })
}
