import { getDb } from '@/lib/db';
import { Conversation } from '../conversation';

// Simple logging function - in a real application, you would use a proper logging library
function log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(meta || {})
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Allows an administrator to take over a conversation from AI.
 * Updates the conversation status to 'human_active' and assigns the agent.
 * 
 * @param conversationId - The ID of the conversation to take over
 * @param agentId - The ID of the agent taking over
 * @param reason - Optional reason for the takeover
 * @returns The updated conversation
 */
export async function takeOverConversation(conversationId: number, agentId: number, reason?: string): Promise<Conversation | null> {
  log('info', 'Admin taking over conversation', { 
    conversationId,
    agentId,
    reason 
  });

  // Update the conversation status to human_active and assign the agent
  const result = await getDb().execute({
    sql: `
      UPDATE conversations 
      SET status = 'human_active', 
          assigned_agent_id = ?, 
          assigned_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ? AND status = 'ai_active'
    `,
    args: [agentId, conversationId]
  });

  if (result.rowsAffected === 0) {
    log('warn', 'Failed to take over conversation - not found or not in ai_active status', { 
      conversationId,
      agentId 
    });
    return null;
  }

  // Fetch the updated conversation
  const convResult = await getDb().execute({
    sql: 'SELECT * FROM conversations WHERE id = ?',
    args: [conversationId]
  });

  if (convResult.rows.length === 0) {
    log('error', 'Conversation not found after takeover', { 
      conversationId 
    });
    return null;
  }

  const conversation = convResult.rows[0] as unknown as Conversation;

  log('info', 'Successfully taken over conversation', { 
    conversationId,
    agentId,
    newStatus: conversation.status 
  });

  return conversation;
}

/**
 * Releases a conversation from human agent back to AI control.
 * Updates the conversation status to 'ai_active' and removes the agent assignment.
 * 
 * @param conversationId - The ID of the conversation to release
 * @param agentId - The ID of the agent releasing the conversation (for verification)
 * @returns The updated conversation
 */
export async function releaseToAIMode(conversationId: number, agentId: number): Promise<Conversation | null> {
  log('info', 'Admin releasing conversation to AI mode', { 
    conversationId,
    agentId 
  });

  // Update the conversation status to ai_active and remove the agent assignment
  const result = await getDb().execute({
    sql: `
      UPDATE conversations 
      SET status = 'ai_active', 
          assigned_agent_id = NULL, 
          assigned_at = NULL,
          updated_at = datetime('now')
      WHERE id = ? AND assigned_agent_id = ? AND status = 'human_active'
    `,
    args: [agentId, conversationId]
  });

  if (result.rowsAffected === 0) {
    log('warn', 'Failed to release conversation to AI mode - not found, not assigned to this agent, or not in human_active status', { 
      conversationId,
      agentId 
    });
    return null;
  }

  // Fetch the updated conversation
  const convResult = await getDb().execute({
    sql: 'SELECT * FROM conversations WHERE id = ?',
    args: [conversationId]
  });

  if (convResult.rows.length === 0) {
    log('error', 'Conversation not found after release to AI mode', { 
      conversationId 
    });
    return null;
  }

  const conversation = convResult.rows[0] as unknown as Conversation;

  log('info', 'Successfully released conversation to AI mode', { 
    conversationId,
    agentId,
    newStatus: conversation.status 
  });

  return conversation;
}

/**
 * Gets a conversation by its ID.
 * 
 * @param conversationId - The ID of the conversation to retrieve
 * @returns The conversation or null if not found
 */
export async function getConversationById(conversationId: number): Promise<Conversation | null> {
  const result = await getDb().execute({
    sql: 'SELECT * FROM conversations WHERE id = ?',
    args: [conversationId]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as unknown as Conversation;
}

/**
 * Gets conversations with optional filters.
 * 
 * @param filters - Optional filters to apply
 * @returns Array of conversations
 */
export async function getConversations(filters: {
  status?: 'ai_active' | 'escalated' | 'human_active' | 'closed';
  channel?: 'web' | 'whatsapp' | 'n8n';
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Conversation[]> {
  let query = 'SELECT * FROM conversations WHERE 1=1';
  const args: any[] = [];

  if (filters.status) {
    query += ' AND status = ?';
    args.push(filters.status);
  }

  if (filters.channel) {
    query += ' AND channel = ?';
    args.push(filters.channel);
  }

  if (filters.search) {
    query += ' AND (user_identifier LIKE ? OR user_name LIKE ? OR booking_reference LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    args.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY updated_at DESC';

  if (filters.limit !== undefined) {
    query += ' LIMIT ?';
    args.push(filters.limit);
    
    if (filters.offset !== undefined) {
      query += ' OFFSET ?';
      args.push(filters.offset);
    }
  }

  const result = await getDb().execute({
    sql: query,
    args: args
  });

  return result.rows as unknown as Conversation[];
}