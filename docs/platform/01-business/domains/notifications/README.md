# NOTIFICATIONS DOMAIN

> Notification intent management, delivery tracking, and user preferences.

## Responsibility
- Owns: notification intents, delivery records, user preferences, quiet hours, templates
- Does NOT own: channel delivery (Communication infrastructure), channel providers (Evolution, Resend, FCM)

## Boundaries
- Inbound: All domains (via events)
- Outbound: Communication (delivery), Analytics (metrics)

## Status
- Stage: Runtime (Communication infrastructure built in B11B.1)
- Maturity: 40%
- Extraction: Architecture complete, runtime pending

## Domain Model
- Entities: NotificationIntent, DeliveryRecord, UserPreference, NotificationTemplate
- Value Objects: Channel, NotificationStatus, DeliveryStatus, Priority, QuietHours
- Aggregates: NotificationIntent (root, invariants: delivery state machine)
- Events: notification.requested, notification.delivered, notification.failed, notification.read
- Policies: ChannelRoutingPolicy, RetryPolicy, QuietHoursPolicy, FallbackPolicy

## Relationship with Communication
- **Notifications** = business domain (what to send, to whom, when)
- **Communication** = infrastructure (how to send, via which provider)
- Notifications publishes intents, Communication delivers them
