# Quickstart: WhatsApp Business Workflow Setup

## Prerequisites

- Access to the n8n instance at `https://agent-ia.innotechlabssas.lat`
- Twilio account with WhatsApp capability (sandbox OK for dev)
- Stripe account with webhook configuration access
- Vercel deployment or local dev server accessible via ngrok

## Step 1: Twilio WhatsApp Sandbox (Development)

1. Go to [Twilio Console](https://console.twilio.com) → Messaging → Try it out → Send a WhatsApp message
2. Copy sandbox number (e.g., `+14155238886`) and join code
3. From your personal WhatsApp, send `join <sandbox-code>` to the sandbox number
4. Note your Twilio Account SID and Auth Token

## Step 2: Configure Twilio Credentials in n8n

1. Log in to n8n at `https://agent-ia.innotechlabssas.lat`
2. Go to **Credentials** → **Add Credential**
3. Select **Twilio** node type
4. Enter:
   - Account SID
   - Auth Token (or API Key SID + Secret for production)
5. Test credential and save

## Step 3: Create WhatsApp Message Templates

1. In Twilio Console → **Content Template Builder**
2. Create three utility templates with EN + ES variants:

### payment_confirmed (EN)
```
Thank you {{1}}! Your payment of {{3}} for booking {{2}} has been received.
We will notify you when your driver is assigned.
```
### payment_confirmed (ES)
```
¡Gracias {{1}}! Tu pago de {{3}} por la reserva {{2}} ha sido recibido.
Te notificaremos cuando tu conductor sea asignado.
```

### driver_assigned (EN)
```
Your driver {{1}} is on the way! Vehicle: {{2}}. Estimated arrival: {{3}}.
```
### driver_assigned (ES)
```
¡Tu conductor {{1}} está en camino! Vehículo: {{2}}. Llegada estimada: {{3}}.
```

### delivery_completed (EN)
```
Your delivery for booking {{1}} has been completed. Thank you for choosing our service!
```
### delivery_completed (ES)
```
¡Tu entrega para la reserva {{1}} ha sido completada. Gracias por elegir nuestro servicio!
```

3. Submit for approval (approval takes minutes to 24 hours in sandbox)

## Step 4: Import n8n Workflow

1. Open n8n at `https://agent-ia.innotechlabssas.lat`
2. Click **Workflows** → **Import from File**
3. Import the single unified workflow file (provided by the n8n admin)
4. The workflow should have webhook triggers for:
   - `payment-confirmed`
   - `driver-assigned`
   - `delivery-completed`
5. Connect the Twilio credential to the Twilio node
6. Map template Content SIDs to the correct template variables
7. Activate the workflow

## Step 5: Configure Stripe Webhook

The Stripe webhook already routes through the app:
```
Stripe → app/api/payments/webhook/route.ts → lib/n8n/client.ts → n8n
```

No Stripe configuration changes needed. Ensure the Stripe Checkout Session metadata includes `customerPhone` (optional).

## Step 6: Verify End-to-End

1. Trigger a test Stripe payment (use Stripe CLI: `stripe trigger payment_intent.succeeded`)
2. Check app logs for successful n8n webhook call
3. Check n8n execution logs for Twilio node output
4. Verify WhatsApp message appears on sandbox-joined test phone
5. Repeat for driver-assigned and delivery-completed events

## Local Development

If testing locally instead of production:
1. Start ngrok: `ngrok http 3000`
2. Update Stripe webhook to forward to ngrok URL
3. Ensure `N8N_BASE_URL` in `.env.local` points to the real n8n instance
4. n8n will call back to the ngrok URL for the app webhook responses
