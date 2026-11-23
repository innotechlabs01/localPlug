# CAPABILITIES

> **What the platform can do.**
> Each capability is a business function that the platform provides.
> Applications consume these capabilities — they never reinvent them.

---

## Capability Map

### Core Operations
| Capability | Description | Owner Domain |
|------------|-------------|--------------|
| **Booking Management** | Create, modify, cancel reservations. Pricing, quotes, promotions. | Booking |
| **Dispatch Engine** | Match drivers to bookings. Broadcast, accept/reject, reassignment. | Dispatch |
| **Trip Lifecycle** | Track trips from start to completion. Route, milestones, ETA. | Trips |
| **Driver Operations** | Registration, compliance, documents, availability, performance. | Drivers |
| **Vehicle Fleet** | Registry, categorization, maintenance, assignment. | Vehicles |
| **Customer CRM** | Profiles, history, preferences, loyalty. | Customers |

### Financial
| Capability | Description | Owner Domain |
|------------|-------------|--------------|
| **Payment Processing** | Paddle integration, webhooks, refunds. | Payments |
| **Driver Earnings** | Per-trip earnings, commission calculations. | Payments |
| **Payouts** | Driver payout scheduling and processing. | Payments |
| **Revenue Analytics** | Financial metrics, reporting, forecasting. | Analytics |

### Communication
| Capability | Description | Owner Domain |
|------------|-------------|--------------|
| **WhatsApp Integration** | Send/receive via Evolution API. Templates, buttons, media. | Notifications |
| **Push Notifications** | Real-time alerts to mobile/web apps. | Notifications |
| **In-App Messaging** | Chat between customer, driver, dispatch. | Chat |
| **Email Delivery** | Transactional emails (confirmations, receipts). | Notifications |

### Intelligence
| Capability | Description | Owner Domain |
|------------|-------------|--------------|
| **AI Concierge** | GPT-4o powered chat for customer support. | AI |
| **Smart Matching** | AI-assisted driver-booking matching. | Dispatch |
| **Fraud Detection** | Anomaly detection in bookings and payments. | Analytics |
| **Demand Forecasting** | Predict booking volume by time/zone. | Analytics |

### Content & Experiences
| Capability | Description | Owner Domain |
|------------|-------------|--------------|
| **Experience Catalog** | Tours, excursions, curated services. | Experiences |
| **Hotel Partnerships** | Hotel integration, room bookings. | Hotels |
| **Promotion Engine** | Discounts, packages, seasonal offers. | Booking |

### Platform Infrastructure
| Capability | Description | Owner Domain |
|------------|-------------|--------------|
| **Real-Time Updates** | Socket.IO for live status, location, chat. | System |
| **Role-Based Access** | Admin roles, driver permissions, claims. | Auth |
| **Audit Trail** | Who did what, when, with full history. | System |
| **Feature Flags** | Runtime toggles for gradual rollout. | System |
| **Event Bus** | Decoupled domain communication. | System |

---

## Capability Maturity

| Maturity | Meaning |
|----------|---------|
| 🟢 **Production** | Live, tested, monitored |
| 🟡 **Building** | In progress (Epic 2C) |
| 🔵 **Designed** | Architecture defined, not yet implemented |
| ⬜ **Planned** | Future capability |

### Current Maturity

| Capability | Status |
|------------|--------|
| Booking Management | 🟡 Building (B13 pending) |
| Dispatch Engine | 🟡 Building (B14 pending) |
| Trip Lifecycle | 🔵 Designed |
| Driver Operations | 🟡 Building (B15 pending) |
| Vehicle Fleet | 🟡 Building (B17 pending) |
| Customer CRM | 🟡 Building (B18 pending) |
| Payment Processing | 🟡 Building (B19 pending) |
| WhatsApp Integration | 🟢 Production (legacy) |
| AI Concierge | 🟢 Production (legacy) |
| Real-Time Updates | 🔵 Designed (B23 pending) |
| Event Bus | 🟢 Built (B10) |
| Domain Services | 🟢 Built (B9) |
| Database Layer | 🟢 Built (B4) |
