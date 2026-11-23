// @lp/communication — Template Contract
// A Template renders message content for each channel + language.

import type { Channel } from './provider'

export interface TemplateContext {
  readonly locale: string
  readonly payload: Record<string, unknown>
}

export interface RenderedMessage {
  readonly channel: Channel
  readonly subject?: string
  readonly body: string
  readonly metadata?: Record<string, unknown>
}

export interface CommunicationTemplate {
  readonly id: string
  readonly channels: Channel[]

  render(channel: Channel, context: TemplateContext): RenderedMessage
}
