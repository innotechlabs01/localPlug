const N8N_BASE_URL = process.env.N8N_BASE_URL
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
  if (!N8N_BASE_URL) {
    console.error('[n8n] N8N_BASE_URL is not configured')
    return { success: false, error: 'N8N_BASE_URL is not configured' }
  }

  const payload: N8nWebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  }

  const webhookUrl = `${N8N_BASE_URL}/webhook/${event}`
  console.log(`[n8n] Sending webhook: ${event}`, { url: webhookUrl, hasApiKey: !!N8N_API_KEY })

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { Authorization: `Bearer ${N8N_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[n8n] Webhook failed: ${response.status} ${response.statusText}`, { error: errorText })
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const result = await response.json()
    console.log(`[n8n] Webhook success: ${event}`, { workflowId: result.workflowId })
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
  console.log('[n8n] triggerPaymentConfirmation called', { bookingReference: bookingData.bookingReference })

  // Send WhatsApp directly via Evolution API
  const phone = bookingData.customerPhone
  if (phone) {
    const isSpanish = /[áéíóúñ¿¡]/.test(bookingData.customerName) ||
      bookingData.customerName.toLowerCase().includes('maría') ||
      bookingData.customerName.toLowerCase().includes('josé')

    const message = isSpanish
      ? `🎉 ¡Hola ${bookingData.customerName}!\n\nTu reserva *#${bookingData.bookingReference.slice(0, 8).toUpperCase()}* está registrada.\nTe avisaremos cuando asignemos un conductor.`
      : `🎉 Hello ${bookingData.customerName}!\n\nYour booking *#${bookingData.bookingReference.slice(0, 8).toUpperCase()}* is registered.\nWe'll notify you when a driver is assigned.`

    sendWhatsAppDirect({
      number: phone,
      message,
    }).then(r => {
      if (!r.success) console.error('[n8n] Direct WhatsApp send failed:', r.error)
    })
  }

  return sendN8nWebhook('payment-confirmed', {
    type: 'payment_confirmation',
    booking: bookingData,
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
      serverUrl: process.env.EVOLUTION_API_URL,
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
  licensePlate: string
  eta?: string
}): Promise<N8nResponse> {
  console.log('[n8n] triggerDriverAssigned called', { bookingReference: data.bookingReference })

  // Send WhatsApp directly via Evolution API
  const phone = data.customerPhone
  if (phone) {
    const isSpanish = /[áéíóúñ¿¡]/.test(data.customerName) ||
      data.customerName.toLowerCase().includes('maría') ||
      data.customerName.toLowerCase().includes('josé')

    const message = isSpanish
      ? `🚗 Conductor asignado para tu reserva *#${data.bookingReference.slice(0, 8).toUpperCase()}*!\n\nConductor: ${data.driverName}\nVehículo: ${data.vehicle}\nPlaca: ${data.licensePlate}`
      : `🚗 Driver assigned for booking *#${data.bookingReference.slice(0, 8).toUpperCase()}*!\n\nDriver: ${data.driverName}\nVehicle: ${data.vehicle}\nPlate: ${data.licensePlate}`

    sendWhatsAppDirect({
      number: phone,
      message,
    }).then(r => {
      if (!r.success) console.error('[n8n] Direct WhatsApp send failed:', r.error)
    })
  }

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
      licensePlate: data.licensePlate,
      eta: data.eta,
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
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
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
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
  const instance = data.instanceName || process.env.EVOLUTION_INSTANCE_NAME

  if (!evoUrl || !evoKey) {
    return { success: false, error: 'Evolution API not configured' }
  }

  // Strip non-digit characters for Evolution API (it expects international format without +)
  const cleanNumber = data.number.replace(/\D/g, '')

  try {
    const response = await fetch(`${evoUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evoKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
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
  const instance = data.instanceName || process.env.EVOLUTION_INSTANCE_NAME

  if (!evoUrl || !evoKey) {
    return { success: false, error: 'Evolution API not configured' }
  }

  // Strip non-digit characters for Evolution API (it expects international format without +)
  const cleanNumber = data.number.replace(/\D/g, '')

  try {
    const response = await fetch(`${evoUrl}/message/sendButtons/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evoKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
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
