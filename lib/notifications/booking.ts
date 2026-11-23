'use server'

import { getDb } from '@/lib/db'
import { sendOrQueueWhatsApp } from '@/lib/n8n/client'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export type NotificationChannel = 'whatsapp' | 'email' | 'both'

export interface BookingNotificationPayload {
  bookingReference: string
  orderNumber?: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerLanguage?: string
  packageName: string
  packagePrice: number
  arrivalDate?: string
  arrivalTime?: string
  flightNumber?: string
  airline?: string
  destinationAddress?: string
  returnDate?: string
  returnTime?: string
  event: 'created' | 'status_changed' | 'payment_updated' | 'driver_assigned' | 'completed' | 'cancelled'
  status?: string
  paymentStatus?: string
  dispatchStatus?: string
  driverName?: string
  driverPhone?: string
  hotelName?: string
  roomName?: string
  numNights?: number
}

/**
 * Construye el mensaje de WhatsApp según el evento e idioma.
 */
function buildWhatsAppMessage(p: BookingNotificationPayload, lang: string): string {
  const isEs = !lang.startsWith('en')
  const ref = p.orderNumber || p.bookingReference

  const header = isEs
    ? `🚐 *Medellín Premium — Reserva ${ref}*\nHola ${p.customerName},`
    : `🚐 *Medellín Premium — Booking ${ref}*\nHi ${p.customerName},`

  const lines: string[] = []
  lines.push(`*Paquete:* ${p.packageName}`)
  lines.push(`*Precio:* $${p.packagePrice.toFixed(2)} USD`)

  if (p.arrivalDate) lines.push(`*Llegada:* ${p.arrivalDate}${p.arrivalTime ? ` ${p.arrivalTime}` : ''}`)
  if (p.flightNumber) lines.push(`*Vuelo:* ${p.airline || ''} ${p.flightNumber}`)
  if (p.destinationAddress) lines.push(`*Destino:* ${p.destinationAddress}`)
  if (p.returnDate) lines.push(`*Regreso:* ${p.returnDate}${p.returnTime ? ` ${p.returnTime}` : ''}`)
  if (p.hotelName) lines.push(`*Hotel:* ${p.hotelName}${p.roomName ? ` (${p.roomName})` : ''}`)
  if (p.driverName) lines.push(`*Conductor asignado:* ${p.driverName}${p.driverPhone ? ` — ${p.driverPhone}` : ''}`)

  let eventText: string
  switch (p.event) {
    case 'created':
      eventText = isEs ? 'Tu reserva ha sido creada con éxito.' : 'Your booking has been created successfully.'
      break
    case 'status_changed':
      eventText = isEs ? `Estado de tu reserva: *${p.status}*.` : `Your booking status: *${p.status}*.`
      break
    case 'payment_updated':
      eventText = isEs ? `Estado de pago: *${p.paymentStatus}*.` : `Payment status: *${p.paymentStatus}*.`
      break
    case 'driver_assigned':
      eventText = isEs
        ? `Un conductor ha sido asignado a tu reserva.`
        : `A driver has been assigned to your booking.`
      break
    case 'completed':
      eventText = isEs ? 'Tu servicio ha sido completado. ¡Gracias!' : 'Your service has been completed. Thank you!'
      break
    case 'cancelled':
      eventText = isEs ? 'Tu reserva ha sido cancelada.' : 'Your booking has been cancelled.'
      break
  }
  lines.push(eventText)

  lines.push(`\nVer detalles: https://www.medellinpremium.com/mis-reservas`)

  return [header, ...lines].join('\n')
}

/**
 * Construye el HTML del email según el evento e idioma.
 */
function buildEmailHtml(p: BookingNotificationPayload, lang: string): string {
  const isEs = !lang.startsWith('en')
  const ref = p.orderNumber || p.bookingReference

  const title = isEs
    ? `Confirmación de reserva ${ref}`
    : `Booking confirmation ${ref}`

  const rows: string[] = []
  rows.push(`<tr><td><strong>Referencia</strong></td><td>${ref}</td></tr>`)
  rows.push(`<tr><td><strong>Paquete</strong></td><td>${p.packageName}</td></tr>`)
  rows.push(`<tr><td><strong>Precio</strong></td><td>$${p.packagePrice.toFixed(2)} USD</td></tr>`)
  if (p.arrivalDate) rows.push(`<tr><td><strong>Llegada</strong></td><td>${p.arrivalDate}${p.arrivalTime ? ` ${p.arrivalTime}` : ''}</td></tr>`)
  if (p.flightNumber) rows.push(`<tr><td><strong>Vuelo</strong></td><td>${p.airline || ''} ${p.flightNumber}</td></tr>`)
  if (p.destinationAddress) rows.push(`<tr><td><strong>Destino</strong></td><td>${p.destinationAddress}</td></tr>`)
  if (p.returnDate) rows.push(`<tr><td><strong>Regreso</strong></td><td>${p.returnDate}${p.returnTime ? ` ${p.returnTime}` : ''}</td></tr>`)
  if (p.hotelName) rows.push(`<tr><td><strong>Hotel</strong></td><td>${p.hotelName}${p.roomName ? ` (${p.roomName})` : ''}</td></tr>`)
  if (p.driverName) rows.push(`<tr><td><strong>Conductor</strong></td><td>${p.driverName}${p.driverPhone ? ` — ${p.driverPhone}` : ''}</td></tr>`)

  let bodyText: string
  switch (p.event) {
    case 'created':
      bodyText = isEs
        ? `Tu reserva ha sido registrada en Medellín Premium. Te contactaremos para confirmar el pago y los detalles de tu llegada.`
        : `Your booking has been registered with Medellín Premium. We will contact you to confirm payment and arrival details.`
      break
    case 'status_changed':
      bodyText = isEs
        ? `El estado de tu reserva ${ref} ha cambiado a: <strong>${p.status}</strong>.`
        : `The status of your booking ${ref} has changed to: <strong>${p.status}</strong>.`
      break
    case 'payment_updated':
      bodyText = isEs
        ? `El estado de pago de tu reserva ${ref} es: <strong>${p.paymentStatus}</strong>.`
        : `The payment status of your booking ${ref} is: <strong>${p.paymentStatus}</strong>.`
      break
    case 'driver_assigned':
      bodyText = isEs
        ? `Un conductor ha sido asignado a tu reserva ${ref}.`
        : `A driver has been assigned to your booking ${ref}.`
      break
    case 'completed':
      bodyText = isEs ? 'Tu servicio ha sido completado. ¡Gracias por confiar en nosotros!' : 'Your service has been completed. Thank you for trusting us!'
      break
    case 'cancelled':
      bodyText = isEs ? `Tu reserva ${ref} ha sido cancelada.` : `Your booking ${ref} has been cancelled.`
      break
  }

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0b0d14;color:#fff;border-radius:12px;padding:24px;border:1px solid #1f2937">
      <h2 style="margin-top:0">${title}</h2>
      <p>Hola <strong>${p.customerName}</strong>,</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows.map(r => `<tr style="border-bottom:1px solid #1f2937"><td style="padding:8px 0">${r.split('</td><td>')[0]}</td><td style="padding:8px 0;text-align:right">${r.split('</td><td>')[1] || ''}</td></tr>`).join('')}</table>
      <p>${bodyText}</p>
      <p><a href="https://www.medellinpremium.com/mis-reservas" style="color:#3b82f6">Ver mis reservas</a></p>
    </div>
  `
}

/**
 * Registra un intento de notificación en outgoing_messages para trazabilidad y reintento.
 */
async function logNotification({
  channel,
  recipient,
  content,
  bookingReference,
  status = 'pending',
}: {
  channel: string
  recipient: string
  content: string
  bookingReference?: string
  status?: string
}): Promise<void> {
  try {
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO outgoing_messages (channel, recipient, content, content_type, metadata, status, max_attempts, created_at, updated_at)
            VALUES (?, ?, ?, 'text', ?, ?, 5, datetime('now'), datetime('now'))`,
      args: [channel, recipient, content, JSON.stringify({ bookingReference }), status],
    })
  } catch (e) {
    logger.error('[Notifications] failed to log message', undefined, { error: e instanceof Error ? e.message : String(e) })
  }
}

/**
 * Envía notificación de reserva por WhatsApp y/o Email.
 * Devuelve el resultado de cada canal.
 */
export async function sendBookingNotification(
  payload: BookingNotificationPayload,
  channels: NotificationChannel = 'both'
): Promise<{
  whatsapp?: { ok: boolean; queued?: boolean; error?: string }
  email?: { ok: boolean; queued?: boolean; error?: string }
}> {
  const results: {
    whatsapp?: { ok: boolean; queued?: boolean; error?: string }
    email?: { ok: boolean; queued?: boolean; error?: string }
  } = {}
  const lang = (payload.customerLanguage || 'es').toLowerCase()

  // ── WhatsApp ──
  if (channels === 'whatsapp' || channels === 'both') {
    if (payload.customerPhone) {
      try {
        const message = buildWhatsAppMessage(payload, lang)
        const waResult = await sendOrQueueWhatsApp({
          number: payload.customerPhone,
          message,
        })
        results.whatsapp = waResult.success
          ? { ok: true }
          : { ok: false, queued: true, error: waResult.error || 'WhatsApp failed' }
        await logNotification({
          channel: 'whatsapp',
          recipient: payload.customerPhone,
          content: message,
          bookingReference: payload.bookingReference,
          status: results.whatsapp.ok ? 'sent' : 'pending',
        })
      } catch (e) {
        results.whatsapp = { ok: false, queued: true, error: e instanceof Error ? e.message : String(e) }
        await logNotification({
          channel: 'whatsapp',
          recipient: payload.customerPhone,
          content: buildWhatsAppMessage(payload, lang),
          bookingReference: payload.bookingReference,
          status: 'pending',
        })
      }
    } else {
      results.whatsapp = { ok: false, error: 'No phone number' }
    }
  }

  // ── Email ──
  if (channels === 'email' || channels === 'both') {
    if (payload.customerEmail) {
      try {
        const subject = lang.startsWith('en')
          ? `Booking ${payload.orderNumber || payload.bookingReference} — Medellín Premium`
          : `Reserva ${payload.orderNumber || payload.bookingReference} — Medellín Premium`
        const emailResult = await sendEmail({
          to: payload.customerEmail,
          subject,
          html: buildEmailHtml(payload, lang),
          text: buildWhatsAppMessage(payload, lang).replace(/\*/g, ''),
          bookingReference: payload.bookingReference,
        })
        results.email = emailResult.ok
          ? { ok: true }
          : { ok: false, queued: emailResult.queued, error: emailResult.error }
        await logNotification({
          channel: 'email',
          recipient: payload.customerEmail,
          content: subject,
          bookingReference: payload.bookingReference,
          status: results.email.ok ? 'sent' : 'pending',
        })
      } catch (e) {
        results.email = { ok: false, queued: true, error: e instanceof Error ? e.message : String(e) }
        await logNotification({
          channel: 'email',
          recipient: payload.customerEmail,
          content: buildEmailHtml(payload, lang),
          bookingReference: payload.bookingReference,
          status: 'pending',
        })
      }
    } else {
      results.email = { ok: false, error: 'No email address' }
    }
  }

  return results
}

/**
 * Notifica al driver que tiene una nueva asignación pendiente.
 */
export async function sendDriverAssignmentNotification({
  driverPhone,
  driverName,
  orderNumber,
  bookingReference,
  pickupAddress,
  pickupTime,
}: {
  driverPhone?: string
  driverName?: string
  orderNumber: string
  bookingReference: string
  pickupAddress?: string
  pickupTime?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!driverPhone) return { ok: false, error: 'No phone' }
  const message = `🚕 Nueva asignación ${orderNumber}\nConductor: ${driverName || '—'}\nRecogida: ${pickupAddress || '—'}\nHora: ${pickupTime || '—'}\nRef: ${bookingReference}\nAcepta en tu panel de conductor.`
  try {
    const res = await sendOrQueueWhatsApp({ number: driverPhone, message })
    await logNotification({
      channel: 'whatsapp',
      recipient: driverPhone,
      content: message,
      bookingReference,
      status: res.success ? 'sent' : 'pending',
    })
    return { ok: res.success, error: res.error }
  } catch (e) {
    await logNotification({
      channel: 'whatsapp',
      recipient: driverPhone,
      content: message,
      bookingReference,
      status: 'pending',
    })
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Notifica al hotel que se ha asignado una habitación para una reserva.
 */
export async function sendHotelRoomAssignmentNotification({
  hotelEmail,
  hotelName,
  customerName,
  roomName,
  checkIn,
  checkOut,
  bookingReference,
}: {
  hotelEmail?: string
  hotelName?: string
  customerName: string
  roomName?: string
  checkIn?: string
  checkOut?: string
  bookingReference: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!hotelEmail) return { ok: false, error: 'No hotel email' }
  const subject = `Nueva asignación de habitación — Reserva ${bookingReference}`
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0b0d14;color:#fff;border-radius:12px;padding:24px;border:1px solid #1f2937">
      <h2>Nueva asignación de habitación</h2>
      <p>Hotel: <strong>${hotelName || '—'}</strong></p>
      <p>Huésped: <strong>${customerName}</strong></p>
      <p>Habitación: <strong>${roomName || '—'}</strong></p>
      <p>Check-in: <strong>${checkIn || '—'}</strong></p>
      <p>Check-out: <strong>${checkOut || '—'}</strong></p>
      <p>Referencia de reserva: <strong>${bookingReference}</strong></p>
    </div>
  `
  try {
    const res = await sendEmail({ to: hotelEmail, subject, html, text: subject, bookingReference })
    await logNotification({
      channel: 'email',
      recipient: hotelEmail,
      content: subject,
      bookingReference,
      status: res.ok ? 'sent' : 'pending',
    })
    return { ok: res.ok, error: res.error }
  } catch (e) {
    await logNotification({
      channel: 'email',
      recipient: hotelEmail,
      content: html,
      bookingReference,
      status: 'pending',
    })
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
