// @lp/communication — Provider Contract
// A Provider is a channel adapter (WhatsApp, Email, Push, etc.)

export type Channel = 'whatsapp' | 'email' | 'push' | 'sms' | 'websocket' | 'inapp'

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'dlq'

export interface SendMessageInput {
  readonly channel: Channel
  readonly recipient: string
  readonly subject?: string
  readonly body: string
  readonly metadata?: Record<string, unknown>
}

export interface SendMessageResult {
  readonly success: boolean
  readonly messageId: string
  readonly channel: Channel
  readonly provider: string
  readonly status: DeliveryStatus
  readonly error?: string
  readonly sentAt: Date
}

export interface CommunicationProvider {
  readonly name: string
  readonly channel: Channel

  send(input: SendMessageInput): Promise<SendMessageResult>

  validate?(input: SendMessageInput): boolean
}
