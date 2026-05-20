-- Migration: Create chat and support tables
-- Created: 2026-05-16
-- Feature: 007-n8n-ai-chat-support

-- Conversations table - tracks chat sessions
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_identifier TEXT NOT NULL, -- email, phone, or anonymous ID
  user_name TEXT,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'ai_active', -- ai_active, escalated, human_active, closed
  assigned_agent_id INTEGER, -- FK → support_agents.id
  assigned_at TEXT,
  order_id INTEGER, -- FK → orders.id (optional, links to booking)
  booking_reference TEXT,
  channel TEXT NOT NULL DEFAULT 'web', -- web, whatsapp, n8n
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  flagged INTEGER NOT NULL DEFAULT 0, -- 0 or 1, fraud/suspicion flag
  flag_reason TEXT,
  ai_confidence REAL, -- 0.0 to 1.0, AI confidence in handling
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_agent_id) REFERENCES support_agents(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Messages table - individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL, -- user, ai, agent, system
  sender_id TEXT, -- agent ID if sender_type = 'agent', or user identifier
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, system, escalation, image
  metadata TEXT, -- JSON for additional data (n8n workflow ID, AI confidence, etc.)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Support agents table - human support team members
CREATE TABLE IF NOT EXISTS support_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, -- FK → users.id (optional, links to admin user)
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'offline', -- available, busy, offline
  max_conversations INTEGER NOT NULL DEFAULT 5,
  current_conversations INTEGER NOT NULL DEFAULT 0,
  specializations TEXT, -- JSON array of specializations (billing, logistics, etc.)
  last_active_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chat sessions table - tracks n8n workflow sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  n8n_workflow_id TEXT,
  n8n_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, failed
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_identifier ON conversations(user_identifier);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_flagged ON conversations(flagged);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_agents_status ON support_agents(status);
CREATE INDEX IF NOT EXISTS idx_support_agents_email ON support_agents(email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_conversation_id ON chat_sessions(conversation_id);
