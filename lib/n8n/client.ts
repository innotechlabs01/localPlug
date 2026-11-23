const N8N_BASE_URL = process.env.N8N_BASE_URL
const N8N_API_KEY = process.env.N8N_API_KEY || ''

import { enqueueMessage } from '@/lib/queue/message-queue'
import { isCircuitOpen, recordSuccess, recordFailure } from '@/lib/resilience/circuit-breaker'
import { logger } from '@/lib/logger'

const WHATSAPP_CIRCUIT = 'evolution-whatsapp'
const N8N_CIRCUIT = 'n8n-webhook'
const WHATSAPP_MSG_DELAY_MS = 3000
const WHATSAPP_RATE_LIMIT_PER_HOUR = 50
const _whatsappMsgTimestamps: number[] = []

interface N8nWebhookPayload {
  event: string
  data: Record<string, unknown>
  timestamp: string
}

interface N8nResponse {
  success: boolean
  workflowId?: string
  error?: string
  message?: string
  confidence?: number
}

function checkWhatsAppRateLimit(): boolean {
  const now = Date.now()
  const oneHourAgo = now - 3600000
  while (_whatsappMsgTimestamps.length > 0 && _whatsappMsgTimestamps[0] < oneHourAgo) {
    _whatsappMsgTimestamps.shift()
  }
  return _whatsappMsgTimestamps.length < WHATSAPP_RATE_LIMIT_PER_HOUR
}

function trackWhatsAppSend(): void {
  _whatsappMsgTimestamps.push(Date.now())
}

/**
 * Send a webhook event to n8n workflow automation
 */
export async function sendN8nWebhook(
  event: string,
  data: Record<string, unknown>,
): Promise<N8nResponse> {
  if (!N8N_BASE_URL) {
    logger.error('[n8n] N8N_BASE_URL is not configured')
    return { success: false, error: 'N8N_BASE_URL is not configured' }
  }

  if (isCircuitOpen(N8N_CIRCUIT)) {
    logger.warn('[n8n] Circuit open, queuing webhook', { event })
    await enqueueMessage({
      channel: 'n8n',
      recipient: event,
      content: JSON.stringify(data),
    })
    return { success: false, error: 'Circuit open, message queued' }
  }

  const payload: N8nWebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  }

  const webhookUrl = `${N8N_BASE_URL}/webhook/${event}`

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
      recordFailure(N8N_CIRCUIT)
      const errorText = await response.text()
      logger.error('[n8n] Webhook failed', new Error(`HTTP ${response.status}`), { event, errorText })
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    recordSuccess(N8N_CIRCUIT)

    let result: Record<string, unknown>
    try {
      result = await response.json()
    } catch {
      const text = await response.text()
      return { success: true, message: text }
    }

    const msg = (typeof result.message === 'string' ? result.message
      : typeof result.response === 'string' ? result.response
      : typeof result.content === 'string' ? result.content
      : typeof result.reply === 'string' ? result.reply
      : typeof result.text === 'string' ? result.text
      : typeof result.output === 'string' ? result.output
      : JSON.stringify(result))
    const wfId = typeof result.workflowId === 'string' ? result.workflowId : undefined
    const conf = typeof result.confidence === 'number' ? result.confidence : undefined
    return { success: true, workflowId: wfId, message: msg, confidence: conf }
  } catch (error) {
    recordFailure(N8N_CIRCUIT)
    logger.error('[n8n] Webhook error', error instanceof Error ? error : undefined)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Trigger n8n workflow for payment confirmation
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
  const phone = bookingData.customerPhone
  if (phone) {
    const isSpanish = /[áéíóúñ¿¡]/.test(bookingData.customerName) ||
      bookingData.customerName.toLowerCase().includes('maría') ||
      bookingData.customerName.toLowerCase().includes('josé')

    const message = isSpanish
      ? `🎉 ¡Hola ${bookingData.customerName}!\n\nTu reserva *#${bookingData.bookingReference.slice(0, 8).toUpperCase()}* está registrada.\nTe avisaremos cuando asignemos un conductor.`
      : `🎉 Hello ${bookingData.customerName}!\n\nYour booking *#${bookingData.bookingReference.slice(0, 8).toUpperCase()}* is registered.\nWe'll notify you when a driver is assigned.`

    await sendOrQueueWhatsApp({ number: phone, message })
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
  const phone = data.customerPhone
  if (phone) {
    const isSpanish = /[áéíóúñ¿¡]/.test(data.customerName) ||
      data.customerName.toLowerCase().includes('maría') ||
      data.customerName.toLowerCase().includes('josé')

    const message = isSpanish
      ? `🚗 Conductor asignado para tu reserva *#${data.bookingReference.slice(0, 8).toUpperCase()}*!\n\nConductor: ${data.driverName}\nVehículo: ${data.vehicle}\nPlaca: ${data.licensePlate}`
      : `🚗 Driver assigned for booking *#${data.bookingReference.slice(0, 8).toUpperCase()}*!\n\nDriver: ${data.driverName}\nVehicle: ${data.vehicle}\nPlate: ${data.licensePlate}`

    await sendOrQueueWhatsApp({ number: phone, message })
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
 * Trigger n8n workflow for feedback request after service completion.
 * Sends a WhatsApp message with a link to the feedback form.
 */
export async function triggerFeedbackRequest(data: {
  bookingReference: string
  customerName: string
  customerPhone?: string
  bookingId?: string
}): Promise<N8nResponse> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const feedbackUrl = data.bookingId
    ? `${siteUrl}/feedback?bookingId=${data.bookingId}`
    : `${siteUrl}/feedback`

  const phone = data.customerPhone
  if (phone) {
    const isSpanish = /[áéíóúñ¿¡]/.test(data.customerName) ||
      data.customerName.toLowerCase().includes('maría') ||
      data.customerName.toLowerCase().includes('josé')

    const message = isSpanish
      ? `🙏 ¡Hola ${data.customerName}!\n\nGracias por viajar con LocalPlug. Tu opinión nos ayuda a mejorar.\n\n¿Cómo fue tu experiencia? Cuéntanos en 1 minuto:\n\n${feedbackUrl}\n\n¡Gracias por tu tiempo! ❤️`
      : `🙏 Hello ${data.customerName}!\n\nThank you for traveling with LocalPlug. Your feedback helps us improve.\n\nHow was your experience? Tell us in 1 minute:\n\n${feedbackUrl}\n\nThank you for your time! ❤️`

    await sendOrQueueWhatsApp({ number: phone, message })
  }

  return sendN8nWebhook('feedback-request', {
    type: 'feedback_request',
    booking: {
      bookingReference: data.bookingReference,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      bookingId: data.bookingId,
    },
    feedbackUrl,
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
  userEmail?: string
  userPhone?: string
  userCountry?: string
  bookingInfo?: Record<string, unknown> | null
  conversationHistory?: Array<{ role: string; content: string }>
}): Promise<N8nResponse> {
  const { conversationHistory, ...rest } = conversationData
  return sendN8nWebhook('ai-chat-message', {
    type: 'chat_message',
    conversation: rest,
    context: {
      history: conversationHistory || [],
      booking: conversationData.bookingInfo || null,
    },
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
  agentAvailable?: boolean
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
 * Trigger n8n workflow for hotel manager creation
 */
export async function triggerManagerCreated(data: {
  managerName: string
  managerEmail: string
  temporaryPassword: string
  hotelName: string
  hotelSlug: string
  managerPhone?: string
}): Promise<N8nResponse> {
  const phone = data.managerPhone
  if (phone) {
    const message = `🏨 *Bienvenido a LocalPlug!*\n\nHola ${data.managerName},\n\nHas sido asignado como gerente del hotel *${data.hotelName}*.\n\n*Tus credenciales de acceso:*\n📧 Email: ${data.managerEmail}\n🔑 Contraseña: ${data.temporaryPassword}\n\nIngresa a la plataforma para gestionar tu hotel.\n\n_Puedes cambiar tu contraseña después del primer inicio de sesión._`

    await sendOrQueueWhatsApp({ number: phone, message })
  }

  return sendN8nWebhook('manager-created', {
    type: 'manager_creation',
    manager: {
      name: data.managerName,
      email: data.managerEmail,
      temporaryPassword: data.temporaryPassword,
    },
    hotel: {
      name: data.hotelName,
      slug: data.hotelSlug,
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    },
  })
}

export async function sendOrQueueWhatsApp(data: {
  number: string
  message: string
  instanceName?: string
}): Promise<N8nResponse> {
  if (!checkWhatsAppRateLimit()) {
    logger.warn('[WhatsApp] Rate limit approaching, queuing message', { number: data.number.slice(-4) })
    await enqueueMessage({
      channel: 'whatsapp',
      recipient: data.number,
      content: data.message,
    })
    return { success: false, error: 'Rate limit, message queued' }
  }

  if (isCircuitOpen(WHATSAPP_CIRCUIT)) {
    logger.warn('[WhatsApp] Circuit open, queuing message', { number: data.number.slice(-4) })
    await enqueueMessage({
      channel: 'whatsapp',
      recipient: data.number,
      content: data.message,
    })
    return { success: false, error: 'Circuit open, message queued' }
  }

  const result = await sendWhatsAppDirect(data)

  if (result.success) {
    recordSuccess(WHATSAPP_CIRCUIT)
    trackWhatsAppSend()
  } else {
    recordFailure(WHATSAPP_CIRCUIT)
    logger.error('[WhatsApp] Direct send failed, queuing', undefined, { error: result.error })
    await enqueueMessage({
      channel: 'whatsapp',
      recipient: data.number,
      content: data.message,
      max_attempts: 3,
    })
  }

  return result
}

/**
 * Send WhatsApp message directly via Evolution API
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
      const body = await response.text().catch(() => '')
      return { success: false, error: `Evolution API HTTP ${response.status}: ${body.slice(0, 200)}` }
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
 * Trigger n8n workflow for driver new assignment notification (with accept/decline)
 */
export async function triggerDriverNewAssignment(data: {
  assignmentId: number
  orderId: number
  bookingReference: string
  customerName: string
  customerPhone?: string
  driverId: number
  driverName: string
  driverPhone?: string
  vehiclePlate: string
  vehicleBrand: string
  serviceType: string
  pickupLocation: string
  destination: string
  pickupDate: string
  pickupTime: string
  estimatedDuration: string
  observations: string
}): Promise<N8nResponse> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return sendN8nWebhook('driver-new-assignment', {
    event: 'driver_assignment',
    assignmentId: data.assignmentId,
    serviceId: data.bookingReference,
    driver: {
      id: String(data.driverId),
      name: data.driverName,
      phone: data.driverPhone || '',
    },
    vehicle: {
      id: '',
      plate: data.vehiclePlate,
      brand: data.vehicleBrand,
      model: '',
      color: '',
    },
    service: {
      type: data.serviceType,
      pickup: data.pickupLocation,
      destination: data.destination,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      estimatedDuration: data.estimatedDuration,
      observations: data.observations,
    },
    actions: {
      accept: {
        type: 'POST',
        endpoint: `${siteUrl}/api/assignments/${data.assignmentId}/accept`,
      },
      decline: {
        type: 'POST',
        endpoint: `${siteUrl}/api/assignments/${data.assignmentId}/decline`,
      },
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    },
  })
}

/**
 * Trigger n8n workflow for driver creation notification
 */
export async function triggerDriverCreated(data: {
  driverName: string
  driverEmail: string
  temporaryPassword: string
  driverPhone?: string
  vehicle: string
  plate: string
}): Promise<N8nResponse> {
  const phone = data.driverPhone
  if (phone) {
    const message = `🚗 *Bienvenido a LocalPlug!*\n\nHola ${data.driverName},\n\nHas sido registrado como conductor en LocalPlug.\n\n*Tus credenciales de acceso:*\n📧 Email: ${data.driverEmail}\n🔑 Contraseña: ${data.temporaryPassword}\n\n*Tu vehículo:*\n🚗 ${data.vehicle}\n🔢 Placa: ${data.plate}\n\nIngresa a la plataforma para ver tus asignaciones.\n\n_Puedes cambiar tu contraseña después del primer inicio de sesión._`

    await sendOrQueueWhatsApp({ number: phone, message })
  }

  return sendN8nWebhook('driver-created', {
    type: 'driver_creation',
    driver: {
      name: data.driverName,
      email: data.driverEmail,
      temporaryPassword: data.temporaryPassword,
      vehicle: data.vehicle,
      plate: data.plate,
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    },
  })
}

/**
 * Trigger n8n workflow for client driver confirmed notification
 */
export async function triggerClientDriverConfirmed(data: {
  assignmentId: number
  orderId: number
  bookingReference: string
  customerName: string
  customerPhone?: string
  driverName: string
  driverPhone?: string
  driverPhoto?: string
  vehiclePlate: string
  vehicleBrand: string
  pickupDate: string
  pickupTime: string
  pickupLocation: string
  destination: string
}): Promise<N8nResponse> {
  const phone = data.customerPhone
  if (phone) {
    const isSpanish = /[áéíóúñ¿¡]/.test(data.customerName) ||
      data.customerName.toLowerCase().includes('maría') ||
      data.customerName.toLowerCase().includes('josé')

    const message = isSpanish
      ? `🚗 *Tu conductor ha confirmado!*\n\n*Conductor:* ${data.driverName}\n*Vehículo:* ${data.vehicleBrand}\n*Placa:* ${data.vehiclePlate}\n*Fecha:* ${data.pickupDate}\n*Hora:* ${data.pickupTime}\n*Recogida:* ${data.pickupLocation}\n*Destino:* ${data.destination}\n\n📞 Contacto: ${data.driverPhone || 'No disponible'}\nEstado: *Confirmado*`
      : `🚗 *Your driver is confirmed!*\n\n*Driver:* ${data.driverName}\n*Vehicle:* ${data.vehicleBrand}\n*Plate:* ${data.vehiclePlate}\n*Date:* ${data.pickupDate}\n*Time:* ${data.pickupTime}\n*Pickup:* ${data.pickupLocation}\n*Destination:* ${data.destination}\n\n📞 Contact: ${data.driverPhone || 'Not available'}\nStatus: *Confirmed*`

    await sendOrQueueWhatsApp({ number: phone, message })
  }

  return sendN8nWebhook('driver-confirmed', {
    event: 'driver_confirmed',
    assignmentId: data.assignmentId,
    serviceId: data.bookingReference,
    client: {
      name: data.customerName,
      phone: data.customerPhone || '',
    },
    driver: {
      name: data.driverName,
      phone: data.driverPhone || '',
      photo: data.driverPhoto || '',
    },
    vehicle: {
      plate: data.vehiclePlate,
      brand: data.vehicleBrand,
      model: '',
      color: '',
    },
    service: {
      pickup: data.pickupLocation,
      destination: data.destination,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
    },
    evolutionApi: {
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    },
  })
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
