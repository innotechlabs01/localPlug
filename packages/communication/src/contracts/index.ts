// @lp/communication — Contracts barrel
export type { Channel, DeliveryStatus, SendMessageInput, SendMessageResult, CommunicationProvider } from './provider'
export type { RecipientType, Recipient, NotificationIntent, CommunicationHandler } from './handler'
export type { ChannelSelection, CommunicationRouter } from './router'
export type { TemplateContext, RenderedMessage, CommunicationTemplate } from './template'
export type { DeliveryRecord, DeliveryTracker } from './delivery'
export type { NotificationPreferences, PreferenceResolver } from './preferences'
export type { RetryPolicy, RetryResult, RetryEvaluator, DeadLetterQueue } from './retry'
export type { CommunicationMetrics } from './metrics'
