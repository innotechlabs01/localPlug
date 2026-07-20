// @lp/communication — In-Memory Router
// Selects channels based on COMMUNICATION_MATRIX rules.

import type { CommunicationRouter, ChannelSelection } from '../contracts/router'
import type { Recipient } from '../contracts/handler'
import type { Channel } from '../contracts/provider'

// Channel matrix: event type → allowed channels
const CHANNEL_MATRIX: Record<string, Channel[]> = {
  // Booking events
  'booking.created': ['whatsapp', 'inapp', 'websocket'],
  'booking.confirmed': ['whatsapp', 'email', 'push', 'inapp', 'websocket'],
  'booking.cancelled': ['whatsapp', 'email', 'inapp', 'websocket'],
  'booking.completed': ['whatsapp', 'email', 'inapp', 'websocket'],

  // Assignment events
  'assignment.created': ['push', 'inapp', 'websocket'],
  'assignment.accepted': ['whatsapp', 'push', 'inapp', 'websocket'],
  'assignment.rejected': ['inapp', 'websocket'],

  // Trip events
  'trip.started': ['push', 'inapp', 'websocket'],
  'trip.location.updated': ['websocket'],
  'trip.completed': ['whatsapp', 'email', 'push', 'inapp', 'websocket'],

  // Payment events
  'payment.succeeded': ['whatsapp', 'email', 'inapp', 'websocket'],
  'payment.failed': ['whatsapp', 'email', 'push', 'inapp', 'websocket'],
  'payment.refunded': ['email', 'inapp', 'websocket'],

  // Driver events
  'driver.onboarded': ['whatsapp', 'email', 'push', 'inapp', 'websocket'],
  'driver.approved': ['whatsapp', 'email', 'push', 'inapp', 'websocket'],
  'driver.suspended': ['whatsapp', 'email', 'inapp', 'websocket'],

  // Vehicle events
  'vehicle.registered': ['inapp', 'websocket'],

  // Hotel events
  'hotel.created': ['email', 'inapp', 'websocket'],
  'hotel.status.changed': ['whatsapp', 'email', 'inapp', 'websocket'],
  'hotel.manager.assigned': ['whatsapp', 'email', 'inapp', 'websocket'],
  'room.created': ['inapp', 'websocket'],
  'commission.updated': ['email', 'inapp', 'websocket'],

  // Customer events
  'customer.created': ['whatsapp', 'email', 'inapp', 'websocket'],
  'customer.updated': ['inapp', 'websocket'],

  // Chat events
  'conversation.created': ['inapp', 'websocket'],
  'message.sent': ['inapp', 'websocket'],
  'conversation.ended': ['inapp', 'websocket'],
  'conversation.escalated': ['whatsapp', 'push', 'inapp', 'websocket'],

  // AI events
  'ai.response.generated': ['inapp', 'websocket'],
  'ai.escalated': ['whatsapp', 'push', 'inapp', 'websocket'],

  // Ratings
  'rating.submitted': ['inapp', 'websocket'],

  // Cases
  'case.opened': ['whatsapp', 'push', 'inapp', 'websocket'],
  'case.assigned': ['whatsapp', 'push', 'inapp', 'websocket'],
  'case.escalated': ['whatsapp', 'email', 'push', 'inapp', 'websocket'],
  'case.resolved': ['whatsapp', 'inapp', 'websocket'],

  // Settings
  'setting.updated': ['inapp', 'websocket'],
  'feature_flag.toggled': ['inapp', 'websocket'],
}

export class InMemoryRouter implements CommunicationRouter {
  selectChannels(
    recipient: Recipient,
    eventType: string,
    userPreferences?: Record<Channel, boolean>
  ): ChannelSelection {
    const matrixChannels = CHANNEL_MATRIX[eventType] || ['inapp', 'websocket']

    // Intersect matrix with user preferences
    const availableChannels = userPreferences
      ? matrixChannels.filter(ch => userPreferences[ch] !== false)
      : matrixChannels

    // Always include inapp as fallback
    if (!availableChannels.includes('inapp')) {
      availableChannels.push('inapp')
    }

    return {
      recipient,
      channels: availableChannels,
      reason: `Matrix: ${matrixChannels.join(',')}, User prefs applied`,
    }
  }
}
