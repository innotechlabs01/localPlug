'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

const conversations = [
  { id: 1, name: 'Sofía Martínez', preview: 'I need to change my pickup location for tomorrow\'s airport transfer', time: '2m ago', unread: 2, priority: 'high', online: true, color: 'var(--accent)', tag: 'Booking', tagBg: 'var(--accent-soft)' },
  { id: 2, name: 'James Rodriguez', preview: 'The VIP tour was amazing! Quick question about...', time: '15m ago', unread: 0, priority: 'normal', online: true, color: 'var(--info)', tag: 'Feedback', tagBg: 'var(--info-soft)' },
  { id: 3, name: 'Ana López', preview: 'I haven\'t received my receipt for trip #1003', time: '1h ago', unread: 1, priority: 'medium', online: false, color: 'var(--warning)', tag: 'Billing', tagBg: 'var(--warning-soft)' },
  { id: 4, name: 'Carlos Gómez', preview: 'Can I book a shuttle for 6 people instead of 4?', time: '2h ago', unread: 0, priority: 'normal', online: true, color: 'var(--danger-soft)', tag: 'Booking', tagBg: 'var(--accent-soft)' },
  { id: 5, name: 'Emma Wilson', preview: 'Lost property — I think I left my phone in the...', time: '4h ago', unread: 0, priority: 'high', online: false, color: 'var(--success)', tag: 'Lost Item', tagBg: 'var(--danger-soft)' },
  { id: 6, name: 'Pierre Dubois', preview: 'Merci beaucoup for the wonderful experience!', time: 'Yesterday', unread: 0, priority: 'normal', online: false, color: 'var(--accent-soft)', tag: 'Feedback', tagBg: 'var(--info-soft)' },
]

const messages = [
  { type: 'date', text: 'Today' },
  { type: 'received', text: 'Hi! I need to change my pickup location for tomorrow\'s airport transfer. I\'m staying at Hotel Dann Carlton.', time: '9:42 AM' },
  { type: 'sent', text: 'Hello Sofía! Of course, I can help with that. Could you tell me the new pickup location?', time: '9:45 AM' },
  { type: 'received', text: 'Actually, I\'ll be at the Poblado Mall entrance instead. Is that possible?', time: '9:47 AM' },
  { type: 'system', text: 'Sofía\'s reservation #1001 has been updated' },
  { type: 'sent', text: 'Absolutely! I\'ve updated your pickup location to Poblado Mall entrance for tomorrow at 10:00 AM. You\'ll receive a confirmation shortly.', time: '9:50 AM' },
  { type: 'received', text: 'Perfect, thank you so much for the quick help! 😊', time: '9:52 AM', isLast: true },
  { type: 'date', text: 'Yesterday' },
  { type: 'received', text: 'Just checking in — will the driver be able to help with luggage?', time: '2:30 PM' },
  { type: 'sent', text: 'Yes, all our drivers provide luggage assistance as part of the service!', time: '2:32 PM' },
]

export default function SupportPage() {
  const { t } = useI18n()
  const d = (t.admin as any).support ?? {}
  const [activeConv, setActiveConv] = useState(1)
  const [filter, setFilter] = useState('all')
  const [input, setInput] = useState('')

  const qreplies = ['I\'ll look into that right away', 'Let me check your reservation', 'Can you provide more details?', 'Thank you for your patience']

  return (
    <div className="support-layout">
      {/* ── Conversation List ── */}
      <div className="conv-list">
        <div className="conv-list-header">
          <div style={{ fontSize: 15, fontWeight: 600 }}>{d.supportTickets || 'Support Tickets'}</div>
          <div className="conv-search">
            <input className="input" placeholder={d.searchConversations || 'Search conversations...'} />
          </div>
        </div>
        <div className="ticket-tabs">
          {[{ id: 'all', label: 'All' }, { id: 'open', label: 'Open' }, { id: 'pending', label: 'Pending' }, { id: 'resolved', label: 'Resolved' }, { id: 'emergency', label: 'Emergency' }].map(tab => (
            <button key={tab.id} className={`ticket-tab ${filter === tab.id ? 'active' : ''} ${tab.id === 'emergency' ? 'emergency' : ''}`} onClick={() => setFilter(tab.id)}>{tab.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(c => {
            const isActive = activeConv === c.id
            const pClass = c.priority === 'high' ? 'priority-high' : c.priority === 'medium' ? 'priority-medium' : ''
            return (
              <div key={c.id} className={`conv-item ${isActive ? 'active' : ''} ${pClass}`} onClick={() => setActiveConv(c.id)}>
                <div className="conv-avatar" style={{ background: c.color }}>
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  {c.online && <span className="online-dot" style={{ background: 'var(--accent)' }} />}
                </div>
                <div className="conv-info">
                  <div className="conv-name">
                    <span>{c.name}</span>
                    <span className="time">{c.time}</span>
                  </div>
                  <div className="conv-preview">{c.preview}</div>
                  <div className="conv-meta">
                    <span className="conv-tag" style={{ background: c.tagBg }}>{c.tag}</span>
                    {c.priority === 'high' && <span className="priority-badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>Urgent</span>}
                  </div>
                </div>
                {c.unread > 0 && <span className="conv-unread">{c.unread}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="chat-area">
        <div className="chat-header">
          <div className="conv-avatar" style={{ background: conversations[0].color }}>
            {conversations[0].name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{conversations[0].name}</div>
            <div className="chat-header-status">{d.online || 'Online'} · {d.bookingRef || 'Booking'} #1001</div>
          </div>
          <div className="flex gap-1">
            <button className="icon-btn" title={d.assign || 'Assign'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
            <button className="icon-btn" title={d.resolve || 'Resolve'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <button className="icon-btn" title={d.more || 'More'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* Emergency Banner */}
        <div className="emergency-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {d.emergencyMsg || 'This conversation has been flagged as high priority'}
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => {
            if (msg.type === 'date') return <div key={idx} className="msg-date-divider">{msg.text}</div>
            if (msg.type === 'system') return <div key={idx} className="msg-system">{msg.text}</div>
            return (
              <div key={idx} className={`msg ${msg.type}`}>
                {msg.text}
                <div className="msg-time">{msg.time}</div>
              </div>
            )
          })}
        </div>

        {/* Quick Replies */}
        <div className="quick-reply-section">
          <div className="quick-reply-header">{d.quickReplies || 'Quick Replies'}</div>
          <div className="quick-reply">
            {qreplies.map((qr, idx) => (
              <button key={idx} className="quick-reply-btn" onClick={() => setInput(qr)}>{qr}</button>
            ))}
          </div>
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input"
            rows={1}
            placeholder={d.typeMessage || 'Type a message...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setInput('') } }}
          />
          <button className="btn btn-primary" style={{ height: 40, width: 40, padding: 0, flexShrink: 0, borderRadius: 'var(--radius-md)' }} onClick={() => setInput('')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}