// @lp/communication — Main barrel
// Communication Runtime for LocalPlug Platform

// Kernel
export { CommunicationRuntime } from './kernel'
export type { RuntimeConfig, ProcessingResult, DeliveryAttempt } from './kernel'

// Contracts
export type {
  Channel,
  DeliveryStatus,
  SendMessageInput,
  SendMessageResult,
  CommunicationProvider,
  RecipientType,
  Recipient,
  NotificationIntent,
  CommunicationHandler,
  ChannelSelection,
  CommunicationRouter,
  TemplateContext,
  RenderedMessage,
  CommunicationTemplate,
  DeliveryRecord,
  DeliveryTracker,
  NotificationPreferences,
  PreferenceResolver,
  RetryPolicy,
  RetryResult,
  RetryEvaluator,
  DeadLetterQueue,
  CommunicationMetrics,
} from './contracts'

// In-Memory Implementations (for testing)
export { InMemoryRouter } from './routing/in-memory-router'
export { InMemoryDeliveryTracker } from './delivery/in-memory-tracker'
export { InMemoryMetrics } from './metrics/in-memory-metrics'
