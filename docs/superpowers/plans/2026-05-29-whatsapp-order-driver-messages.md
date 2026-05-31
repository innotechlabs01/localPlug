# WhatsApp Order & Driver Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send WhatsApp messages when orders are created and when drivers are assigned

**Architecture:** n8n webhooks receive events from the app, format messages in Code nodes, and send via Evolution API. The app calls `triggerDriverAssigned()` after admin assigns a driver in the dispatch panel.

**Tech Stack:** Next.js API routes, n8n, Evolution API, WhatsApp, Turso/SQLite

---

### Task 1: Add `licensePlate` to `triggerDriverAssigned()`

**Files:**
- Modify: `lib/n8n/client.ts:97-121`

- [ ] **Step 1: Add `licensePlate` to the interface**

Edit the `triggerDriverAssigned()` function signature to include `licensePlate`:

```typescript
export async function triggerDriverAssigned(data: {
  bookingReference: string
  customerName: string
  customerPhone?: string
  driverName: string
  vehicle: string
  licensePlate: string
  eta?: string
}): Promise<N8nResponse> {
```

- [ ] **Step 2: Add `licensePlate` to the n8n payload**

In the same function, add `licensePlate` to the `driver` object in the payload:

```typescript
    driver: {
      name: data.driverName,
      vehicle: data.vehicle,
      licensePlate: data.licensePlate,
      eta: data.eta,
    },
```

- [ ] **Step 3: Verify the changes**

Run: `npx tsc --noEmit` (or `npm run typecheck` if available)

---

### Task 2: Trigger n8n from dispatch route after driver assignment

**Files:**
- Modify: `app/api/admin/dispatch/route.ts:94-127`

- [ ] **Step 1: Add import for `triggerDriverAssigned`**

Add at the top of the file:

```typescript
import { triggerDriverAssigned } from '@/lib/n8n/client'
```

- [ ] **Step 2: Add n8n trigger after successful assignment**

After the `UPDATE drivers SET status = 'busy'` block and before the `return NextResponse.json(...)` (after line 124), add:

```typescript
    // Trigger n8n WhatsApp notification
    try {
      const orderData = await db.execute({
        sql: 'SELECT booking_reference, customer_name, customer_phone FROM orders WHERE id = ?',
        args: [orderId],
      })
      const driverData = await db.execute({
        sql: 'SELECT name, vehicle, plate FROM drivers WHERE id = ?',
        args: [driverId],
      })

      if (orderData.rows.length > 0 && driverData.rows.length > 0) {
        const o = orderData.rows[0]
        const d = driverData.rows[0]
        triggerDriverAssigned({
          bookingReference: o.booking_reference as string,
          customerName: o.customer_name as string,
          customerPhone: o.customer_phone as string || undefined,
          driverName: d.name as string,
          vehicle: d.vehicle as string,
          licensePlate: d.plate as string,
        }).catch(err => console.error('[Dispatch] n8n trigger failed:', err))
      }
    } catch (n8nErr) {
      console.error('[Dispatch] Failed to prepare n8n trigger:', n8nErr)
    }
```

- [ ] **Step 3: Verify the changes**

Run: `npx tsc --noEmit`

---

### Task 3: Update n8n workflow message templates

**Files:**
- Modify: n8n workflow `payment-confirmed` (Code node)
- Create: n8n workflow `driver-assigned`

- [ ] **Step 1: Update `payment-confirmed` Code node message**

In the n8n workflow at `https://agent-ia.innotechlabssas.lat`, edit the "Format Welcome Message" Code node to send a simpler confirmation message:

```javascript
const booking = $input.first().json.data.booking;
const phone = booking.customerPhone;
const name = booking.customerName;
const ref = booking.bookingReference;

const isSpanish = /[áéíóúñ¿¡]/.test(name) ||
                  name.toLowerCase().includes('maría') ||
                  name.toLowerCase().includes('josé');

const message = isSpanish
  ? `¡Hola ${name}! 🎉\n\nTu reserva *#${ref.slice(0, 8).toUpperCase()}* está registrada.\nTe avisaremos cuando asignemos un conductor.`
  : `Hello ${name}! 🎉\n\nYour booking *#${ref.slice(0, 8).toUpperCase()}* is registered.\nWe'll notify you when a driver is assigned.`;

return [{
  json: {
    phone: phone,
    message: message,
    instance: 'localplug-main'
  }
}];
```

- [ ] **Step 2: Create `driver-assigned` n8n workflow**

In n8n, create a new workflow:
1. **Webhook node**: POST, path `/webhook/driver-assigned`, header auth (Bearer)
2. **Code node**: Format driver assignment message
3. **Evolution API node**: Send text message
4. **HTTP Request node**: Callback to app

Code for the "Format Driver Assigned Message" node:

```javascript
const data = $input.first().json.data;
const booking = data.booking;
const driver = data.driver;
const phone = booking.customerPhone;
const name = booking.customerName;
const ref = booking.bookingReference;
const driverName = driver.name;
const vehicle = driver.vehicle;
const plate = driver.licensePlate;

const isSpanish = /[áéíóúñ¿¡]/.test(name) ||
                  name.toLowerCase().includes('maría') ||
                  name.toLowerCase().includes('josé');

const message = isSpanish
  ? `🚗 ¡Hola ${name}!\n\nTu reserva *#${ref.slice(0, 8).toUpperCase()}* tiene conductor asignado:\n\n👤 Conductor: ${driverName}\n🚙 Vehículo: ${vehicle}\n🔢 Placa: ${plate}\n\n¡Que tengas un excelente viaje!`
  : `🚗 Hello ${name}!\n\nYour booking *#${ref.slice(0, 8).toUpperCase()}* has a driver assigned:\n\n👤 Driver: ${driverName}\n🚙 Vehicle: ${vehicle}\n🔢 Plate: ${plate}\n\nHave a great trip!`;

return [{
  json: {
    phone: phone,
    message: message,
    instance: data.evolutionApi?.instanceName || 'localplug-main'
  }
}];
```

Callback HTTP Request node config:
- URL: `https://localplug.vercel.app/api/webhooks/n8n`
- Method: POST
- Body: `{ event: "whatsapp-sent", data: { bookingReference: "{{booking.bookingReference}}", whatsappMessageId: "{{$json.key?.id}}", status: "sent" }, timestamp: "{{$now.toISO()}}" }`

- [ ] **Step 3: Activate both workflows**

Toggle both workflows to "Active" in n8n.

---

### Task 4: Smoke test the flow

- [ ] **Step 1: Test payment-confirmed webhook manually**

```bash
curl -X POST https://agent-ia.innotechlabssas.lat/webhook/payment-confirmed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -d '{
    "event": "payment-confirmed",
    "data": {
      "booking": {
        "bookingReference": "test-123",
        "customerName": "Juan Pérez",
        "customerPhone": "573001234567",
        "packageName": "The VIP Arrival",
        "amount": 89,
        "flightNumber": "AV123",
        "airline": "Avianca",
        "arrivalDate": "2026-06-15",
        "arrivalTime": "14:30"
      }
    },
    "timestamp": "2026-05-29T10:00:00.000Z"
  }'
```

- [ ] **Step 2: Test driver-assigned webhook manually**

```bash
curl -X POST https://agent-ia.innotechlabssas.lat/webhook/driver-assigned \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -d '{
    "event": "driver-assigned",
    "data": {
      "type": "driver_assignment",
      "booking": {
        "bookingReference": "test-123",
        "customerName": "Juan Pérez",
        "customerPhone": "573001234567"
      },
      "driver": {
        "name": "Carlos López",
        "vehicle": "Mercedes V-Class",
        "licensePlate": "ABC-123"
      },
      "evolutionApi": {
        "instanceName": "localplug-main"
      }
    },
    "timestamp": "2026-05-29T10:00:00.000Z"
  }'
```
