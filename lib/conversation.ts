import { PaymentRecord } from './payment-record';

export interface Conversation {
  id: number;
  user_identifier: string; // Phone number (E.164) or email
  user_name?: string;
  user_email?: string;
  status: 'ai_active' | 'escalated' | 'human_active' | 'closed';
  assigned_agent_id?: number;
  assigned_at?: string; // ISO timestamp
  order_id?: number;
  booking_reference?: string;
  channel: 'web' | 'whatsapp' | 'n8n';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  flagged: 0 | 1;
  flag_reason?: string;
  ai_confidence?: number; // 0.0 to 1.0
  last_message_at?: string; // ISO timestamp
  whatsapp_instance?: string; // Evolution API instance name
  whatsapp_message_id?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp;
  
  // Relationships
  payment_record?: PaymentRecord;
}