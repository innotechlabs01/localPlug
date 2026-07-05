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

export async function incrementAgentLoad(agentId: number): Promise<boolean> {
  const db = getDb()

  const result = await db.execute({
    sql: `
      UPDATE support_agents
      SET current_conversations = current_conversations + 1,
          status = CASE WHEN current_conversations + 1 >= max_conversations THEN 'busy' ELSE 'available' END,
          last_active_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ? AND current_conversations < max_conversations
    `,
    args: [agentId],
  })

  return result.rowsAffected > 0
}

export async function decrementAgentLoad(agentId: number): Promise<boolean> {
  const db = getDb()

  const result = await db.execute({
    sql: `
      UPDATE support_agents
      SET current_conversations = MAX(0, current_conversations - 1),
          status = CASE WHEN MAX(0, current_conversations - 1) >= max_conversations THEN 'busy' ELSE 'available' END,
          updated_at = datetime('now')
      WHERE id = ? AND current_conversations > 0
    `,
    args: [agentId],
  })

  return result.rowsAffected > 0
}
