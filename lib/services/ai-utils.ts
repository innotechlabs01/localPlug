/**
 * Shared AI service utilities — deduplication of escalation detection and response types.
 */

export interface AiResponse {
  message: string
  confidence: number
}

const ESCALATION_KEYWORDS = [
  'hablar con alguien', 'hablar con una persona', 'hablar con un agente', 'hablar con un humano',
  'hablar con soporte', 'ayuda humana', 'queja', 'problema', 'reclamo', 'reembolso',
  'cancelar', 'cancelación', 'refund', 'cancel', 'cancellation',
  'talk to someone', 'talk to a person', 'talk to an agent', 'talk to a human',
  'talk to support', 'human help', 'complaint', 'problem', 'issue',
]

export function detectEscalation(text: string): boolean {
  const lower = text.toLowerCase()
  return ESCALATION_KEYWORDS.some(k => lower.includes(k))
}
