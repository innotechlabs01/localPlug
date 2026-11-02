export interface PaymentRecord {
  booking_reference: string;
  package_id: string;
  package_name: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  polar_transaction_id: string;
  polar_webhook_event_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}