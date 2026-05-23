import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendWelcomeWhatsAppMessage } from '@/lib/services/whatsapp-service';

// This is a simplified webhook handler. In production, you should verify the webhook signature.
// For the purpose of this task, we assume the webhook is from Stripe and the data is valid.

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const stripeSignature = request.headers.get('stripe-signature');

    // In a real implementation, you would verify the signature using your endpoint secret.
    // For example, using the Stripe Node.js library:
    // const event = stripe.webhooks.constructEvent(body, stripeSignature, endpointSecret);
    // But since we are not installing the Stripe Node.js library in this task, we'll parse directly.
    // Note: This is not secure and should not be used in production without signature verification.

    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('⚠️  Webhook error while parsing basic request.', err);
      return NextResponse.json({ received: false }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const stripeWebhookEventId = event.id; // The ID of the webhook event

      // Check if we have already processed this webhook event by looking for a payment record with this stripe_webhook_event_id
      // Note: We store the stripe_webhook_event_id in the payment record.
      const db = getDb()
      const existingPayment = await db.execute({
        sql: 'SELECT * FROM payment_records WHERE stripe_webhook_event_id = ?',
        args: [stripeWebhookEventId]
      });

      if (existingPayment.rows.length > 0) {
        // Already processed this webhook event
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Find the payment record by stripe_payment_intent_id
      const paymentResult = await db.execute({
        sql: 'SELECT * FROM payment_records WHERE stripe_payment_intent_id = ?',
        args: [paymentIntentId]
      });

      if (paymentResult.rows.length === 0) {
        // No payment record found for this payment intent
        console.error(`⚠️  Payment record not found for payment intent: ${paymentIntentId}`);
        return NextResponse.json({ received: false }, { status: 404 });
      }

      const paymentRecord = paymentResult.rows[0] as any;

      // Update the payment record with the webhook event ID and set status to completed
      await db.execute({
        sql: `
          UPDATE payment_records 
          SET status = ?, stripe_webhook_event_id = ?, updated_at = ?
          WHERE id = ?
        `,
        args: [
          'completed',
          stripeWebhookEventId,
          new Date().toISOString(),
          paymentRecord.id
        ]
      });

      // Send the WhatsApp welcome message
      await sendWelcomeWhatsAppMessage(paymentRecord);

      // Return a 200 response to acknowledge receipt of the event
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Return a 200 response for all other events to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`⚠️  Webhook handler failed.`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}