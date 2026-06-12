const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b'

const SYSTEM_PROMPT = `Eres el asistente virtual de LocalPlug, un servicio de conserjería premium para viajeros.

Tu trabajo es:
1. Ayudar con información sobre reservas, paquetes, y servicios
2. Responder preguntas sobre la ciudad, aeropuerto, transporte
3. Guiar al usuario a través del proceso de reserva
4. Resolver dudas post-pago

Reglas:
- Responde en el MISMO idioma que el usuario
- Sé breve, amable y profesional
- Usa emojis con moderación
- Si el usuario pide hablar con un humano, queja, problema, reembolso, cancelación, reclamo, o algo similar, responde confirmando que un agente lo contactará
- Si no sabes algo, di que un agente se pondrá en contacto pronto

INSTRUCCIÓN CRÍTICA - ESCALACIÓN:
Si el usuario expresa explícitamente querer hablar con un humano (ej: "hablar con alguien", "hablar con un agente", "hablar con una persona", "talk to someone", "talk to a human", "talk to an agent"), debes responder con un mensaje que confirme que un agente lo contactará y NUNCA debes inventar respuestas. Responde con: "Un agente se pondrá en contacto contigo en breve. ⏳" (o su equivalente en el idioma del usuario).`

interface OllamaResponse {
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

function detectEscalation(text: string): boolean {
  const lower = text.toLowerCase()
  return ESCALATION_KEYWORDS.some(k => lower.includes(k))
}

export async function generateOllamaResponse(params: {
  message: string
  conversationHistory?: Array<{ role: string; content: string }>
  bookingInfo?: Record<string, unknown> | null
  userCountry?: string
}): Promise<OllamaResponse> {
  try {
    const { message, conversationHistory, bookingInfo } = params

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    if (bookingInfo) {
      messages.push({
        role: 'system',
        content: `Información de la reserva activa: ${JSON.stringify(bookingInfo, null, 2)}`,
      })
    }

    if (conversationHistory && conversationHistory.length > 0) {
      const limited = conversationHistory.slice(-6)
      for (const m of limited) {
        messages.push({ role: m.role, content: m.content })
      }
    }

    messages.push({ role: 'user', content: message })

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 500,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Ollama] API error:', response.status, errText)
      return { message: '', confidence: 0 }
    }

    const data = await response.json()
    const reply = (data.message?.content || '').trim()

    if (!reply) {
      return { message: '', confidence: 0 }
    }

    const isEscalation = detectEscalation(message)
    const confidence = isEscalation ? 0.3 : 0.85

    return { message: reply, confidence }
  } catch (error) {
    console.error('[Ollama] Error generating response:', error)
    return { message: '', confidence: 0 }
  }
}
