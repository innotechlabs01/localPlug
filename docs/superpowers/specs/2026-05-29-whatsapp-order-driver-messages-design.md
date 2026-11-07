# Design: WhatsApp Messages for Order Creation & Driver Assignment

## Objective

Send two WhatsApp messages via n8n + Evolution API:
1. When an order is created (payment confirmed): confirmation with booking reference
2. When an admin assigns a driver: driver name, vehicle, license plate

## Architecture

```
Payment confirmed → triggerPaymentConfirmation()
  → n8n webhook /webhook/payment-confirmed
  → Evolution API → WhatsApp: "Reserva #ABC confirmada. Te avisaremos..."


Admin assigns driver → PUT /api/admin/dispatch
  → UPDATE orders (assigned_to, dispatch_status)
  → UPDATE drivers (status='busy')
  → triggerDriverAssigned()
    → n8n webhook /webhook/driver-assigned
    → Evolution API → WhatsApp: "Conductor asignado: [nombre], Vehículo: [vehículo], Placa: [placa]"
```

## Files to modify

| File | Change |
|------|--------|
| `lib/n8n/client.ts` | Add `licensePlate` to `triggerDriverAssigned()` payload |
| `app/api/admin/dispatch/route.ts` | Call `triggerDriverAssigned()` after DB assignment |
| n8n workflow `payment-confirmed` | Simplify message to just booking reference + confirmation |
| n8n workflow `driver-assigned` | Create/update with driver data + license plate |

## Data flow

### triggerDriverAssigned() payload (updated)

```typescript
{
  type: 'driver_assignment',
  booking: {
    bookingReference: string,
    customerName: string,
    customerPhone?: string,
  },
  driver: {
    name: string,
    vehicle: string,
    licensePlate: string,  // NEW
    eta?: string,          // optional
  },
  evolutionApi: {
    instanceName: string,
  },
}
```

### Dispatch route change

After successful assignment (line 126 in `dispatch/route.ts`), read order and driver data from DB, then fire `triggerDriverAssigned()`.

## WhatsApp message templates

### Workflow: payment-confirmed (simplified)

**Spanish:**
```
¡Hola [nombre]! 🎉

Tu reserva *[ref]* está registrada.
Te avisaremos cuando asignemos un conductor.
```

**English:**
```
Hello [nombre]! 🎉

Your booking *[ref]* is registered.
We'll notify you when a driver is assigned.
```

### Workflow: driver-assigned (new)

**Spanish:**
```
🚗 ¡Hola [nombre]!

Tu reserva *[ref]* tiene conductor asignado:

👤 Conductor: [nombre]
🚙 Vehículo: [vehículo]
🔢 Placa: [placa]

¡Que tengas un excelente viaje!
```

**English:**
```
🚗 Hello [nombre]!

Your booking *[ref]* has a driver assigned:

👤 Driver: [nombre]
🚙 Vehicle: [vehículo]
🔢 Plate: [placa]

Have a great trip!
```
