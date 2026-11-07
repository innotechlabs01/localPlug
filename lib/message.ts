import { Conversation } from './conversation';

export interface Message {
  id: number;
  conversation_id: number;
  sender_type: 'user' | 'ai' | 'agent' | 'system';
  sender_id?: string; // Agent ID or user identifier
  content: string;
  message_type: 'text' | 'system' | 'escalation' | 'image';
  metadata?: {
    source: 'whatsapp' | 'web' | 'n8n';
    messageId?: string; // WhatsApp message ID
    confidence?: number; // 0.0 to 1.0
    deliveryStatus?: 'sent' | 'delivered' | 'read';
  };
  created_at: string; // ISO timestamp
  
  // Relationships
  conversation?: Conversation;
}