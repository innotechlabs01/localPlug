import { detectEscalation, type AiResponse } from './ai-utils'

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'meta/llama-3.1-8b-instruct'

export async function generateOpenAIResponse(params: {
  message: string
  conversationHistory?: Array<{ role: string; content: string }>
  bookingInfo?: Record<string, unknown> | null
  userCountry?: string
}): Promise<AiResponse> {
  try {
    const { message, conversationHistory, bookingInfo } = params

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: 'Eres el asistente virtual de LocalPlug, un servicio de conserjería premium para viajeros. Tu trabajo es: 1) Ayudar con reservas, paquetes y servicios 2) Responder preguntas sobre la ciudad, aeropuerto, transporte 3) Guiar al usuario en el proceso de reserva. Reglas: Responde en el MISMO idioma del usuario. Sé breve, amable y profesional. Usa emojis con moderación. Si el usuario pide hablar con un humano, confirma que un agente lo contactará.' },
    ]

    if (bookingInfo) {
      messages.push({
        role: 'system',
        content: `Booking info: ${JSON.stringify(bookingInfo, null, 2)}`,
      })
    }

    if (conversationHistory && conversationHistory.length > 0) {
      const limited = conversationHistory.slice(-6)
      for (const m of limited) {
        messages.push({ role: m.role, content: m.content })
      }
    }

    messages.push({ role: 'user', content: message })

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[OpenAI] API error:', response.status, errText)
      return { message: '', confidence: 0 }
    }

    const data = await response.json()
    const reply = (data.choices?.[0]?.message?.content || '').trim()

    if (!reply) {
      return { message: '', confidence: 0 }
    }

    const isEscalation = detectEscalation(message)
    const confidence = isEscalation ? 0.3 : 0.9

    return { message: reply, confidence }
  } catch (error) {
    console.error('[OpenAI] Error generating response:', error)
    return { message: '', confidence: 0 }
  }
}