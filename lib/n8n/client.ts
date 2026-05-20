const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://agent-ia.innotechlabssas.lat'
const N8N_API_KEY = process.env.N8N_API_KEY || ''

interface N8nWebhookPayload {
  event: string
  data: Record<string, unknown>
  timestamp: string
}

interface N8nResponse {
  success: boolean
  workflowId?: string
  error?: string
}

/**
 * Send a webhook event to n8n workflow automation
 */
export async function sendN8nWebhook(
  event: string,
  data: Record<string, unknown>,
): Promise<N8nResponse> {
  const payload: N8nWebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/webhook/${event}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { Authorization: `Bearer ${N8N_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`[n8n] Webhook failed: ${response.status} ${response.statusText}`)
      return { success: false, error: `HTTP ${response.status}` }
    }

    const result = await response.json()
    return { success: true, workflowId: result.workflowId }
  } catch (error) {
    console.error('[n8n] Webhook error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Trigger n8n workflow for payment confirmation
 * Sends booking data to n8n which then sends WhatsApp via Evolution API
 */
export async function triggerPaymentConfirmation(bookingData: {
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  packageName: string
  amount: number
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
}): Promise<N8nResponse> {
  return sendN8nWebhook('payment-confirmed', {
    type: 'payment_confirmation',
    booking: bookingData,
    // Evolution API config for n8n
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'localplug-main',
      serverUrl: process.env.EVOLUTION_API_URL || 'https://api-message.innotechlabssas.lat',
    },
  })
}

/**
 * Trigger n8n workflow for driver assignment notification
 */
export async function triggerDriverAssigned(data: {
  bookingReference: string
  customerName: string
  customerPhone?: string
  driverName: string
  vehicle: string
  eta: string
}): Promise<N8nResponse> {
  return sendN8nWebhook('driver-assigned', {
    type: 'driver_assignment',
    booking: {
      bookingReference: data.bookingReference,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
    },
    driver: {
      name: data.driverName,
      vehicle: data.vehicle,
      eta: data.eta,
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'localplug-main',
    },
  })
}

/**
 * Trigger n8n workflow for delivery completion notification
 */
export async function triggerDeliveryCompleted(data: {
  bookingReference: string
  customerName: string
  customerPhone?: string
}): Promise<N8nResponse> {
  return sendN8nWebhook('delivery-completed', {
    type: 'delivery_completion',
    booking: {
      bookingReference: data.bookingReference,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'localplug-main',
    },
  })
}

/**
 * Trigger n8n workflow for AI chat message
 */
export async function triggerAiChatMessage(conversationData: {
  conversationId: number
  message: string
  userIdentifier: string
  userName?: string
}): Promise<N8nResponse> {
  return sendN8nWebhook('ai-chat-message', {
    type: 'chat_message',
    conversation: conversationData,
  })
}

/**
 * Trigger n8n workflow for escalation to human
 */
export async function triggerEscalation(conversationData: {
  conversationId: number
  reason: string
  userIdentifier: string
  assignedAgentId?: number
}): Promise<N8nResponse> {
  return sendN8nWebhook('escalate-to-human', {
    type: 'escalation',
    conversation: conversationData,
  })
}

/**
 * Trigger n8n workflow for fraud detection
 */
export async function triggerFraudDetection(conversationData: {
  conversationId: number
  message: string
  userIdentifier: string
  flagReason: string
}): Promise<N8nResponse> {
  return sendN8nWebhook('fraud-detection', {
    type: 'fraud_alert',
    conversation: conversationData,
  })
}

/**
 * Send WhatsApp message directly via Evolution API (fallback if n8n is down)
 */
export async function sendWhatsAppDirect(data: {
  number: string
  message: string
  instanceName?: string
}): Promise<N8nResponse> {
  const evoUrl = process.env.EVOLUTION_API_URL
  const evoKey = process.env.EVOLUTION_API_KEY
  const instance = data.instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'localplug-main'

  if (!evoUrl || !evoKey) {
    return { success: false, error: 'Evolution API not configured' }
  }

  try {
    const response = await fetch(`${evoUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evoKey,
      },
      body: JSON.stringify({
        number: data.number,
        text: data.message,
      }),
    })

    if (!response.ok) {
      return { success: false, error: `Evolution API HTTP ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send WhatsApp message with buttons via Evolution API
 */
export async function sendWhatsAppButtons(data: {
  number: string
  title: string
  description: string
  buttons: Array<{ id: string; text: string }>
  instanceName?: string
}): Promise<N8nResponse> {
  const evoUrl = process.env.EVOLUTION_API_URL
  const evoKey = process.env.EVOLUTION_API_KEY
  const instance = data.instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'localplug-main'

  if (!evoUrl || !evoKey) {
    return { success: false, error: 'Evolution API not configured' }
  }

  try {
    const response = await fetch(`${evoUrl}/message/sendButtons/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evoKey,
      },
      body: JSON.stringify({
        number: data.number,
        title: data.title,
        description: data.description,
        buttons: data.buttons,
      }),
    })

    if (!response.ok) {
      return { success: false, error: `Evolution API HTTP ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
