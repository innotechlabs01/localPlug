export interface PaymentRecord {
  booking_reference: string; // Primary key
  package_id: string;
  package_name: string;
  amount: number; // in cents
  currency: string; // e.g., 'USD'
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id: string;
  stripe_webhook_event_id: string; // for dedup
  customer_email: string;
  customer_name: string;
  customer_phone: string; // in E.164 format
  error_message: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}