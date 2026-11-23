// @lp/communication — Router Contract
// A Router selects which channels to use for a recipient + event combination.

import type { Channel } from './provider'
import type { Recipient } from './handler'

export interface ChannelSelection {
  readonly recipient: Recipient
  readonly channels: Channel[]
  readonly reason: string
}

export interface CommunicationRouter {
  selectChannels(
    recipient: Recipient,
    eventType: string,
    userPreferences?: Record<Channel, boolean>
  ): ChannelSelection
}
