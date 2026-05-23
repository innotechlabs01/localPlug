import { getDb } from '@/lib/db';
import { PaymentRecord } from '../payment-record';
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
 * Sends a WhatsApp welcome message after a successful payment.
 * This function is called by the Stripe webhook handler.
 */
export async function sendWelcomeWhatsAppMessage(paymentRecord: PaymentRecord): Promise<void> {
  log('info', 'Processing WhatsApp welcome message', { bookingReference: paymentRecord.booking_reference });
  const db = getDb()

  // Validate that we have a phone number
  if (!paymentRecord.customer_phone) {
    log('error', 'Customer phone number is missing for WhatsApp welcome message', { 
      bookingReference: paymentRecord.booking_reference 
    });
    throw new Error('Customer phone number is required for WhatsApp welcome message');
  }

  // Normalize phone number to E.164 format (remove spaces, dashes, etc., and ensure it starts with +)
  const phoneNumber = paymentRecord.customer_phone.replace(/\s+/g, '').replace(/[-()]/g, '');
  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

  log('info', 'Normalized phone number', { 
    original: paymentRecord.customer_phone,
    normalized: normalizedPhone
  });

  // Check if a conversation already exists for this booking reference
  let conversation: Conversation | null = null;
  if (paymentRecord.booking_reference) {
    const result = await db.execute({
      sql: 'SELECT * FROM conversations WHERE booking_reference = ?',
      args: [paymentRecord.booking_reference]
    });
    if (result.rows.length > 0) {
      conversation = result.rows[0] as unknown as Conversation;
    }
  }

  // If no conversation exists, create a new one
  if (!conversation) {
    log('info', 'Creating new conversation for booking reference', { 
      bookingReference: paymentRecord.booking_reference 
    });
    const result = await db.execute({
      sql: `
        INSERT INTO conversations (
          user_identifier, 
          user_name, 
          status, 
          channel, 
          booking_reference,
          whatsapp_instance
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        normalizedPhone,
        paymentRecord.customer_name,
        'ai_active', // Start with AI active
        'whatsapp',
        paymentRecord.booking_reference,
        'localplug-main' // from Evolution API instance name
      ]
    });
    conversation = {
      id: Number(result.lastInsertRowid),
      user_identifier: normalizedPhone,
      user_name: paymentRecord.customer_name,
      status: 'ai_active',
      channel: 'whatsapp',
      booking_reference: paymentRecord.booking_reference,
      whatsapp_instance: 'localplug-main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Conversation;
  } else {
    log('info', 'Found existing conversation for booking reference', { 
      bookingReference: paymentRecord.booking_reference,
      conversationId: conversation.id
    });
  }

  // Prepare the welcome message content
  const welcomeMessage = generateWelcomeMessage(paymentRecord);

  // In a real implementation, we would send the message via Evolution API here.
  // However, according to the architecture, the actual sending is done by n8n workflows.
  // We will store the message in the database and trigger the n8n workflow via a webhook callback.

  // Store the outgoing message in the messages table
  await db.execute({
    sql: `
      INSERT INTO messages (
        conversation_id,
        sender_type,
        content,
        message_type,
        metadata
      ) VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      conversation.id,
      'system', // This is a system-generated welcome message
      welcomeMessage,
      'text',
      JSON.stringify({
        source: 'whatsapp',
        // We don't have a WhatsApp message ID yet because the message hasn't been sent via Evolution API
        // The n8n workflow will handle sending and then call back with the WhatsApp message ID
        messageId: null,
        deliveryStatus: 'pending'
      })
    ]
  });

  // Update the conversation's last_message_at timestamp
  await db.execute({
    sql: 'UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
    args: [new Date().toISOString(), new Date().toISOString(), conversation.id]
  });

  log('info', 'Successfully created welcome message and stored in database', { 
    bookingReference: paymentRecord.booking_reference,
    conversationId: conversation.id,
    messageLength: welcomeMessage.length
  });

  // In a full implementation, we would now trigger the n8n workflow to send the message via Evolution API.
  // For now, we rely on the webhook infrastructure to handle this.
  // The n8n workflow "Payment → WhatsApp Welcome" should be triggered by the Stripe webhook
  // and will use the payment data to send the message.

  // Note: The actual sending of the WhatsApp message is handled by the n8n workflow,
  // which is triggered by the Stripe webhook (see T016).
}

/**
 * Processes an incoming WhatsApp message from Evolution API webhook.
 * This function is called by the Evolution API webhook handler.
 * 
 * @param eventData - The data from the Evolution API webhook event
 * @returns The conversation that the message belongs to
 */
export async function processIncomingWhatsAppMessage(eventData: any): Promise<Conversation | null> {
  log('info', 'Processing incoming WhatsApp message', { 
    messageId: eventData.key?.id,
    fromMe: eventData.key?.fromMe 
  });

  // Extract phone number from the remote JID (remove @s.whatsapp.net)
  const remoteJid = eventData.key?.remoteJid;
  if (!remoteJid) {
    log('error', 'Missing remoteJid in WhatsApp message event', { eventData });
    return null;
  }

  // Remove the @s.whatsapp.net suffix to get the phone number
  let phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
  
  // Ensure the phone number is in E.164 format
  let normalizedPhone: string;
  try {
    normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  } catch {
    log('error', 'Invalid phone number format', { phoneNumber });
    return null;
  }

  // Ignore messages sent by us (fromMe === true)
  if (eventData.key?.fromMe) {
    log('info', 'Ignoring message sent by us', { 
      phoneNumber: normalizedPhone,
      messageId: eventData.key?.id 
    });
    return null;
  }

  // Extract message content
  const messageContent = eventData.message?.conversation;
  if (!messageContent) {
    log('warn', 'No message content in WhatsApp message event', { 
      phoneNumber: normalizedPhone,
      messageId: eventData.key?.id,
      messageType: eventData.message?.type 
    });
    // We still want to find/create the conversation even if there's no text content
  }

  // Find or create conversation by phone number
  let conversation: Conversation | null = null;
  const db = getDb()
  
  // First, try to find an existing conversation by user_identifier
  const result = await db.execute({
    sql: 'SELECT * FROM conversations WHERE user_identifier = ?',
    args: [normalizedPhone]
  });

  if (result.rows.length > 0) {
    conversation = result.rows[0] as unknown as Conversation;
    log('info', 'Found existing conversation for phone number', { 
      phoneNumber: normalizedPhone,
      conversationId: conversation.id 
    });
  } else {
    // Create a new conversation
    log('info', 'Creating new conversation for phone number', { 
      phoneNumber: normalizedPhone 
    });
    
    const insertResult = await db.execute({
      sql: `
        INSERT INTO conversations (
          user_identifier, 
          status, 
          channel, 
          whatsapp_instance
        ) VALUES (?, ?, ?, ?)
      `,
      args: [
        normalizedPhone,
        'ai_active', // Start with AI active
        'whatsapp',
        eventData.instance || 'localplug-main' // Use instance from event or default
      ]
    });
    
    conversation = {
      id: Number(insertResult.lastInsertRowid),
      user_identifier: normalizedPhone,
      status: 'ai_active',
      channel: 'whatsapp',
      whatsapp_instance: eventData.instance || 'localplug-main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Conversation;
    
    log('info', 'Created new conversation', { 
      phoneNumber: normalizedPhone,
      conversationId: conversation.id 
    });
  }

  // If we have message content, store it in the messages table
  if (messageContent) {
    // Store the incoming message in the messages table
    await db.execute({
      sql: `
        INSERT INTO messages (
          conversation_id,
          sender_type,
          content,
          message_type,
          metadata
        ) VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        conversation.id,
        'user', // Message is from the user
        messageContent,
        'text',
        JSON.stringify({
          source: 'whatsapp',
          messageId: eventData.key?.id,
          // Note: We don't have confidence for incoming messages
          deliveryStatus: 'received' // This is a custom status for incoming messages
        })
      ]
    });

    // Update the conversation's last_message_at timestamp
    await db.execute({
      sql: 'UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
      args: [new Date().toISOString(), new Date().toISOString(), conversation.id]
    });

    log('info', 'Stored incoming message and updated conversation', { 
      conversationId: conversation.id,
      messageId: eventData.key?.id,
      messageLength: messageContent.length 
    });
  }

  // If the conversation is in ai_active state, we should trigger n8n AI processing
  // However, according to the architecture, the actual AI processing is done by n8n workflows.
  // We will rely on the webhook infrastructure to handle this.
  // The n8n workflow "WhatsApp → AI Agent → Response" should be triggered by the Evolution API webhook
  // and will process the message and generate a response.

  // Note: The actual AI processing and response generation is handled by the n8n workflow,
  // which is triggered by the Evolution API webhook (see T024 in n8n-events.md contract).

  return conversation;
}

// Simple OpenAI client for generating responses
// In a real application, you would use the official OpenAI Node.js library
async function generateOpenAIResponse(messages: Array<{role: string, content: string}>, temperature = 0.7, maxTokens = 500): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // In a real implementation, we would call the OpenAI API here
  // For this task, we'll simulate the response based on the last user message
  const lastUserMessage = messages.find(m => m.role === 'user')?.content || '';
  
  // Simple response generation based on keywords in the message
  // This is a placeholder - in reality, we would call the OpenAI API
  const lowerMessage = lastUserMessage.toLowerCase();
  
  // Detect language of the user's message
  const userLanguage = (text: string) => /[ñáéíóúü]/i.test(text) ? 'es' : 'en';
  const detectedLang = userLanguage(lastUserMessage);
  
  // Generate a contextual response based on common booking-related queries
  let response = '';
  
  if (lowerMessage.includes('hola') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    response = detectedLang === 'es' 
      ? '¡Hola! ¿En qué puedo ayudarte con tu reserva?' 
      : 'Hello! How can I help you with your booking?';
  } else if (lowerMessage.includes('reserva') || lowerMessage.includes('booking') || lowerMessage.includes('cita')) {
    response = detectedLang === 'es'
      ? 'Para verificar tu reserva, necesito tu número de referencia de reserva. ¿Podrías proporcionármelo?'
      : 'To check your booking, I need your booking reference number. Could you please provide it?';
  } else if (lowerMessage.includes('fecha') || lowerMessage.includes('date') || lowerMessage.includes('llegada') || lowerMessage.includes('arrival')) {
    response = detectedLang === 'es'
      ? 'Tu fecha de llegada está confirmada en tu reserva. ¿Necesitas modificarla o tienes alguna otra pregunta?'
      : 'Your arrival date is confirmed in your booking. Do you need to modify it or do you have any other questions?';
  } else if (lowerMessage.includes('pago') || lowerMessage.includes('payment') || lowerMessage.includes('costo') || lowerMessage.includes('cost')) {
    response = detectedLang === 'es'
      ? 'Tu pago ha sido procesado correctamente. Si necesitas un recibo, por favor avísame.'
      : 'Your payment has been processed successfully. If you need a receipt, please let me know.';
  } else if (lowerMessage.includes('cancelar') || lowerMessage.includes('cancel')) {
    response = detectedLang === 'es'
      ? 'Entiendo que deseas cancelar tu reserva. Para proceder con la cancelación, necesito verificar algunos detalles. ¿Podrías proporcionar tu número de referencia de reserva?'
      : 'I understand you want to cancel your booking. To proceed with the cancellation, I need to verify some details. Could you please provide your booking reference number?';
  } else {
    // Default response
    response = detectedLang === 'es'
      ? 'Gracias por tu mensaje. Estoy aquí para ayudarte con cualquier pregunta sobre tu reserva. ¿En qué más puedo asistirte?'
      : 'Thank you for your message. I\'m here to help you with any questions about your booking. How else can I assist you?';
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return response;
}

/**
 * Generates a response to a user's WhatsApp message using OpenAI GPT-4o.
 * Detects the language of the user's message and responds in the same language.
 * 
 * @param conversation - The conversation the message belongs to
 * @param userMessage - The message content from the user
 * @returns The AI-generated response
 */
export async function generateAIResponse(conversation: Conversation, userMessage: string): Promise<string> {
  log('info', 'Generating AI response', { 
    conversationId: conversation.id,
    userMessageLength: userMessage.length 
  });

  // Detect the language of the user's message
  const userLanguage = (text: string) => /[ñáéíóúü]/i.test(text) ? 'es' : 'en';
  const detectedLang = userLanguage(userMessage);
  log('info', 'Detected user language', { 
    language: detectedLang,
    userMessage: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '') 
  });

  // Prepare messages for OpenAI (in a real implementation)
  const messages = [
    { 
      role: 'system', 
      content: detectedLang === 'es' 
        ? 'Eres un asistente de reservas para un hotel premium. Respondes en español y eres amable, profesional y conoces bien los detalles de las reservas, incluyendo paquetes, fechas de llegada, políticas de cancelación y más. Si no sabes algo, dices que lo verificarás y volverás a contactar al usuario.' 
        : 'You are a premium hotel booking assistant. You respond in English and are friendly, professional, and knowledgeable about booking details including packages, arrival dates, cancellation policies, and more. If you don\'t know something, you say you\'ll check and get back to the user.'
    },
    { role: 'user', content: userMessage }
  ];

  // Generate response using OpenAI
  let aiResponse = '';
  try {
    aiResponse = await generateOpenAIResponse(messages);
  } catch (error) {
    log('error', 'Failed to generate AI response', { 
      error: (error as Error).message 
    });
    // Fallback response
    aiResponse = detectedLang === 'es'
      ? 'Lo siento, estoy teniendo problemas técnicos para procesar tu mensaje. Un agente humano se pondrá en contacto contigo pronto.'
      : 'Sorry, I\'m experiencing technical difficulties processing your message. A human agent will contact you shortly.';
  }

  log('info', 'Generated AI response', { 
    conversationId: conversation.id,
    responseLength: aiResponse.length,
    language: detectedLang 
  });

  return aiResponse;
}

// Export the normalize function for use in other modules
export { normalizeToE164, isValidE164 } from '../phone-utils';
// Export the detectLanguage function for use in other modules
export { detectLanguage } from '../language-utils';

/**
 * Generates a personalized welcome message based on the payment record.
 * Detects language from the booking data (assuming we have language in the guest data).
 * For simplicity, we'll use English as default and Spanish if the customer name suggests Spanish preference.
 * In a real system, we would have language stored in the payment record or guest data.
 */
function generateWelcomeMessage(paymentRecord: PaymentRecord): string {
  // Simple language detection: if the name contains common Spanish characters or patterns, use Spanish
  // This is a placeholder - in reality, we would have language stored in the database
  const spanishIndicators = /[ñáéíóúü]/i;
  const isSpanish = spanishIndicators.test(paymentRecord.customer_name) || 
                   paymentRecord.customer_name.toLowerCase().includes('juan') ||
                   paymentRecord.customer_name.toLowerCase().includes('maría') ||
                   paymentRecord.customer_name.toLowerCase().includes('josé');

  if (isSpanish) {
    return `¡Hola ${paymentRecord.customer_name}! Gracias por tu reserva. Tu referencia de reserva es ${paymentRecord.booking_reference}. Paquete: ${paymentRecord.package_name}. Fecha de llegada: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}. ¡Estamos emocionados de recibirte!`;
  } else {
    return `Hi ${paymentRecord.customer_name}! Thank you for your booking. Your booking reference is ${paymentRecord.booking_reference}. Package: ${paymentRecord.package_name}. Arrival date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. We're excited to welcome you!`;
  }
}