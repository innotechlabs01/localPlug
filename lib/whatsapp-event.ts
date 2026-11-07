export interface WhatsAppEvent {
  id: number;
  conversation_id?: number; // FK to conversations table
  event_type: string; // Event type from Evolution API (e.g., 'message.upsert', 'message-receipt.update')
  instance_name: string; // Evolution API instance name (e.g., 'localplug-main')
  remote_jid: string; // Phone number in JID format (e.g., '573001234567@s.whatsapp.net')
  message_id?: string; // WhatsApp message ID
  from_me: number; // 1 if sent by us, 0 if received
  content?: string; // Message text content
  message_type?: string; // 'conversation', 'image', 'video', etc.
  status?: string; // 'delivered', 'read', 'pending', 'played'
  participant?: string; // Group participant if applicable
  raw_payload?: string; // Full JSON payload from Evolution API
  created_at: string; // ISO timestamp
}