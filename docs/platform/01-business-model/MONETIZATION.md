# MONETIZATION

> **How the platform makes money.**
> This drives every business decision.
> Architecture serves this — never the other way around.

---

## Revenue Streams

### 1. Booking Commissions
**Primary revenue source.** LocalPlug takes a percentage of each completed booking.

| Service Type | Commission | Notes |
|-------------|-----------|-------|
| Airport Transfer | 15-20% | Base rate for standard transfers |
| Tourism Experience | 20-25% | Higher margin for curated experiences |
| Multi-Day Package | 18-22% | Bundled services |
| Emergency/Last-Minute | 25-30% | Premium for urgency |

### 2. Driver Subscriptions (Future)
Monthly subscription for drivers who want priority access to bookings.

| Tier | Price | Benefits |
|------|-------|----------|
| Basic | Free | Standard booking access |
| Pro | $29/mo | Priority matching, analytics |
| Premium | $59/mo | Guaranteed hours, premium zones |

### 3. Hotel Partnerships
Commission from hotel bookings made through the platform.

| Integration | Commission |
|-------------|-----------|
| Room Booking | 10-15% |
| Experience Referral | 15-20% |
| Airport Transfer Add-On | 12-18% |

### 4. API Access (Future)
Third-party integrations (travel agencies, corporate accounts).

| Tier | Price | Calls/Month |
|------|-------|-------------|
| Starter | $99/mo | 10,000 |
| Business | $299/mo | 100,000 |
| Enterprise | Custom | Unlimited |

### 5. White-Label (Future)
Other cities/operators use the LocalPlug platform under their brand.

---

## Unit Economics

### Per Booking (Airport Transfer)
```
Average booking value:     $45 USD
LocalPlug commission (18%): $8.10
Driver payout:             $34.50
Platform cost per booking: ~$1.50 (infra + API)
Net margin per booking:    ~$6.60 (81% margin)
```

### Per Booking (Tourism Experience)
```
Average booking value:     $120 USD
LocalPlug commission (22%): $26.40
Driver/operator payout:    $84.00
Platform cost per booking: ~$2.50
Net margin per booking:    ~$23.90 (90% margin)
```

### Break-Even
```
Monthly fixed costs:       ~$2,000 (infra, APIs, tools)
Break-even bookings/month: ~250 (at $8.10 avg commission)
Current bookings/month:    ~150
Gap to break-even:         ~100 bookings
```

---

## Pricing Strategy

### Dynamic Pricing Factors
- **Time of day**: Peak hours (6-9am, 5-8pm) premium
- **Demand**: High demand → surge pricing
- **Distance**: Base fare + per-km rate
- **Vehicle type**: Economy → Premium → Luxury multipliers
- **Season**: Holiday premium, off-season discounts

### Promotions Engine
- First-booking discount (acquisition)
- Referral bonuses (growth)
- Hotel package deals (partnerships)
- Seasonal campaigns (retention)

---

## Financial Flows

```
Customer pays → Paddle → LocalPlug account
                              │
                    ┌─────────┴─────────┐
                    │                   │
              Platform share      Driver payout
              (18-25%)            (75-82%)
                    │                   │
              Operating costs     Driver wallet
              (infra, APIs)       (weekly payout)
```

### Payment Processing
- **Provider**: Paddle (handles taxes, refunds, disputes)
- **Payout cycle**: Weekly (Monday)
- **Currency**: USD (primary), COP (future)
- **Refund policy**: Full refund if cancelled 24h+ before; 50% within 24h; 0% no-show

---

## Growth Levers

1. **Driver supply**: More drivers → faster matching → higher satisfaction
2. **Customer acquisition**: First-booking discount → word of mouth → organic growth
3. **Hotel partnerships**: Embedded in hotel check-in → captive audience
4. **Experience upsell**: Transfer + tour bundle → higher average order value
5. **API/SDK**: Travel agencies → volume → lower per-unit cost
