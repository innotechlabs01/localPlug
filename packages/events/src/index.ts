// @lp/events — Event Bus Runtime
// Part of B10. Typed event bus + outbox for decoupled domain communication.

// Types
export { EventType, createEvent } from './types'
export type { DomainEvent, CreateEventOptions } from './types'

// Handler contract
export type { EventHandler, HandlerRegistration, EventBus, EventBusMetrics } from './handler'

// Outbox
export { createOutboxEntry } from './outbox'
export type { OutboxEvent, OutboxStatus, OutboxRepository } from './outbox'

// Implementations
export { InMemoryEventBus } from './bus'
export { OutboxProcessor } from './processor'
export type { OutboxProcessorConfig } from './processor'
