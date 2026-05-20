'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'

interface Conversation {
  id: number
  user_identifier: string
  user_name: string | null
  user_email: string | null
  status: string
  assigned_agent_id: number | null
  booking_reference: string | null
  channel: string
  priority: string
  flagged: number
  flag_reason: string | null
  ai_confidence: number | null
  last_message_at: string | null
  created_at: string
  agent_name: string | null
  agent_email: string | null
  message_count: number
  last_message: string | null
}

interface Message {
  id: number
  conversation_id: number
  sender_type: string
  sender_id: string | null
  content: string
  message_type: string
  metadata?: string | null
  created_at: string
  agent_name: string | null
}

interface Agent {
  id: number
  name: string
  email: string
  phone: string | null
  status: string
  max_conversations: number
  current_conversations: number
  specializations: string | null
  last_active_at: string | null
  maxConversations?: number
}

type FilterMode = 'all' | 'ai_active' | 'escalated' | 'human_active' | 'closed' | 'flagged'
type ChannelFilter = 'all' | 'whatsapp' | 'web'

const STATUS_STYLES: Record<string, string> = {
  ai_active: 'bg-blue-100 text-blue-700',
  escalated: 'bg-amber-100 text-amber-700',
  human_active: 'bg-green-100 text-green-700',
  closed: 'bg-cool-slate-100 text-cool-slate-500',
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-cool-slate-100 text-cool-slate-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-amber-50 text-amber-600',
  urgent: 'bg-red-50 text-red-600',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString()
}

export default function IaChatPage() {
  const { t } = useI18n()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoadingConv, setIsLoadingConv] = useState(true)
  const [isLoadingMsg, setIsLoadingMsg] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [isTakingOver, setIsTakingOver] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        if (filter === 'flagged') {
          params.set('flagged', 'true')
        } else {
          params.set('status', filter)
        }
      }
      if (search) params.set('search', search)

      const res = await fetch(`/api/chat/conversations?${params}`)
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error('[AdminChat] Fetch conversations error:', err)
    } finally {
      setIsLoadingConv(false)
    }
  }, [filter, search])

  const fetchMessages = useCallback(async (convId: number) => {
    setIsLoadingMsg(true)
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${convId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('[AdminChat] Fetch messages error:', err)
    } finally {
      setIsLoadingMsg(false)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/agents')
      const data = await res.json()
      if (data.success) {
        setAgents(data.agents)
      }
    } catch (err) {
      console.error('[AdminChat] Fetch agents error:', err)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    fetchAgents()
  }, [fetchConversations, fetchAgents])

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id)
    }
  }, [selectedConv, fetchMessages])

  const selectConversation = useCallback((conv: Conversation) => {
    setSelectedConv(conv)
    setError(null)
  }, [])

  const sendAsAgent = useCallback(async () => {
    if (!inputValue.trim() || !selectedConv || isSending) return

    const content = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: content,
          userIdentifier: selectedConv.user_identifier,
          senderType: 'agent',
        }),
      })

      const data = await res.json()
      if (data.success && data.response) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          conversation_id: selectedConv.id,
          sender_type: data.response.sender,
          sender_id: null,
          content: data.response.content,
          message_type: data.response.type,
          created_at: new Date().toISOString(),
          agent_name: null,
        }])
        fetchConversations()
      }
    } catch (err) {
      console.error('[AdminChat] Send error:', err)
    } finally {
      setIsSending(false)
    }
  }, [inputValue, selectedConv, isSending, fetchConversations])

  const handleEscalate = useCallback(async () => {
    if (!selectedConv || !escalateReason.trim()) return
    try {
      const res = await fetch('/api/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          reason: escalateReason.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowEscalateModal(false)
        setEscalateReason('')
        fetchConversations()
        setSelectedConv(prev => prev ? { ...prev, status: data.status } : null)
        setMessages(prev => [...prev, {
          id: Date.now(),
          conversation_id: selectedConv.id,
          sender_type: 'system',
          sender_id: null,
          content: `Escalated: ${escalateReason.trim()}`,
          message_type: 'escalation',
          created_at: new Date().toISOString(),
          agent_name: null,
        }])
      }
    } catch (err) {
      console.error('[AdminChat] Escalate error:', err)
    }
  }, [selectedConv, escalateReason, fetchConversations])

  const handleClose = useCallback(async () => {
    if (!selectedConv) return
    try {
      const res = await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          closedBy: 'agent',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCloseModal(false)
        fetchConversations()
        setSelectedConv(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    } catch (err) {
      console.error('[AdminChat] Close error:', err)
    }
  }, [selectedConv, fetchConversations])

  const handleAgentSave = useCallback(async (agentData: Partial<Agent>) => {
    try {
      const res = await fetch('/api/chat/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      })
      const data = await res.json()
      if (data.success) {
        setShowAgentModal(false)
        setEditingAgent(null)
        fetchAgents()
      }
    } catch (err) {
      console.error('[AdminChat] Save agent error:', err)
    }
  }, [fetchAgents])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendAsAgent()
    }
  }, [sendAsAgent])

  const handleTakeOver = useCallback(async () => {
    if (!selectedConv || isTakingOver) return
    setIsTakingOver(true)
    try {
      const res = await fetch('/api/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          reason: 'Admin takeover',
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchConversations()
        setSelectedConv(prev => prev ? { ...prev, status: 'human_active' } : null)
        setMessages(prev => [...prev, {
          id: Date.now(),
          conversation_id: selectedConv.id,
          sender_type: 'system',
          sender_id: null,
          content: 'Admin has taken over this conversation. AI is now paused.',
          message_type: 'system',
          created_at: new Date().toISOString(),
          agent_name: null,
        }])
      }
    } catch (err) {
      console.error('[AdminChat] Takeover error:', err)
    } finally {
      setIsTakingOver(false)
    }
  }, [selectedConv, isTakingOver, fetchConversations])

  const handleReleaseToAI = useCallback(async () => {
    if (!selectedConv) return
    try {
      const res = await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          closedBy: 'agent',
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Reopen as AI active
        await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedConv.id,
            status: 'ai_active',
          }),
        })
        fetchConversations()
        setSelectedConv(prev => prev ? { ...prev, status: 'ai_active' } : null)
        setMessages(prev => [...prev, {
          id: Date.now(),
          conversation_id: selectedConv.id,
          sender_type: 'system',
          sender_id: null,
          content: 'Admin has released this conversation back to AI.',
          message_type: 'system',
          created_at: new Date().toISOString(),
          agent_name: null,
        }])
      }
    } catch (err) {
      console.error('[AdminChat] Release to AI error:', err)
    }
  }, [selectedConv, fetchConversations])

  const filteredConversations = conversations.filter(c => {
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.user_identifier?.toLowerCase().includes(q) ||
        c.user_name?.toLowerCase().includes(q) ||
        c.user_email?.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversation List */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-xl shadow-sm border border-cool-slate-100 overflow-hidden">
        <div className="p-3 border-b border-cool-slate-200 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.chat.searchPlaceholder}
            className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md text-slate-navy placeholder:text-cool-slate-400 focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
          />
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['all', 'whatsapp', 'web'] as ChannelFilter[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-2.5 py-1 rounded-full text-label-sm whitespace-nowrap transition-colors ${
                  channelFilter === ch
                    ? 'bg-mountain-emerald text-white'
                    : 'bg-cool-slate-100 text-cool-slate-600 hover:bg-cool-slate-200'
                }`}
              >
                {ch === 'whatsapp' ? '📱 WhatsApp' : ch === 'web' ? '🌐 Web' : 'All'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['all', 'ai_active', 'escalated', 'human_active', 'closed', 'flagged'] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full text-label-sm whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-slate-navy text-white'
                    : 'bg-cool-slate-100 text-cool-slate-600 hover:bg-cool-slate-200'
                }`}
              >
                {t.admin.chat.filters[f === 'ai_active' ? 'aiActive' : f === 'human_active' ? 'humanActive' : f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConv ? (
            <div className="p-4 text-center text-cool-slate-400">{t.common.loading}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-cool-slate-400">{t.admin.chat.noConversations}</div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-3 border-b border-cool-slate-100 hover:bg-cool-slate-50 transition-colors ${
                  selectedConv?.id === conv.id ? 'bg-mountain-emerald/5 border-l-2 border-l-mountain-emerald' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-label-md text-slate-navy truncate">
                      {conv.user_name || conv.user_identifier}
                    </p>
                    <p className="text-body-md text-cool-slate-500 truncate mt-0.5">
                      {conv.last_message || t.admin.chat.noMessages}
                    </p>
                  </div>
                  <div className="text-label-sm text-cool-slate-400 whitespace-nowrap">
                    {formatDate(conv.last_message_at || conv.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-label-sm ${STATUS_STYLES[conv.status] || STATUS_STYLES.ai_active}`}>
                    {t.admin.chat.status[conv.status as keyof typeof t.admin.chat.status] || conv.status}
                  </span>
                  {conv.channel === 'whatsapp' && (
                    <span className="px-2 py-0.5 rounded text-label-sm bg-green-100 text-green-700">
                      📱 WA
                    </span>
                  )}
                  {conv.channel === 'web' && (
                    <span className="px-2 py-0.5 rounded text-label-sm bg-blue-100 text-blue-700">
                      🌐 Web
                    </span>
                  )}
                  {conv.flagged === 1 && (
                    <span className="px-2 py-0.5 rounded text-label-sm bg-red-100 text-red-600">
                      Flagged
                    </span>
                  )}
                  {conv.priority !== 'normal' && (
                    <span className={`px-2 py-0.5 rounded text-label-sm ${PRIORITY_STYLES[conv.priority] || ''}`}>
                      {t.admin.chat.priority[conv.priority as keyof typeof t.admin.chat.priority] || conv.priority}
                    </span>
                  )}
                  <span className="text-label-sm text-cool-slate-400 ml-auto">
                    {t.admin.chat.conversation.messageCount.replace('{count}', String(conv.message_count))}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation View */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-cool-slate-100 overflow-hidden">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-cool-slate-400">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-cool-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-body-md">{t.admin.chat.noConversations}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="px-4 py-3 border-b border-cool-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-label-md text-slate-navy font-semibold">
                  {selectedConv.user_name || selectedConv.user_identifier}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-label-sm ${STATUS_STYLES[selectedConv.status] || STATUS_STYLES.ai_active}`}>
                    {t.admin.chat.status[selectedConv.status as keyof typeof t.admin.chat.status] || selectedConv.status}
                  </span>
                  {selectedConv.flagged === 1 && (
                    <span className="px-2 py-0.5 rounded text-label-sm bg-red-100 text-red-600">
                      {t.admin.chat.conversation.flagged}: {selectedConv.flag_reason || 'Yes'}
                    </span>
                  )}
                  {selectedConv.agent_name && (
                    <span className="text-label-sm text-cool-slate-500">
                      {t.admin.chat.conversation.agentAssigned}: {selectedConv.agent_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.status === 'ai_active' && selectedConv.channel === 'whatsapp' && (
                  <button
                    onClick={handleTakeOver}
                    disabled={isTakingOver}
                    className="px-3 py-1.5 text-label-sm bg-slate-navy text-white rounded-lg hover:bg-slate-navy/90 disabled:opacity-50 transition-colors"
                  >
                    {isTakingOver ? 'Taking over...' : '🧑‍💼 Take Over'}
                  </button>
                )}
                {selectedConv.status === 'human_active' && (
                  <button
                    onClick={handleReleaseToAI}
                    className="px-3 py-1.5 text-label-sm bg-mountain-emerald text-white rounded-lg hover:bg-mountain-emerald/90 transition-colors"
                  >
                    🤖 AI Mode
                  </button>
                )}
                <button
                  onClick={() => { setShowEscalateModal(true); setEscalateReason('') }}
                  disabled={selectedConv.status === 'human_active' || selectedConv.status === 'closed'}
                  className="px-3 py-1.5 text-label-sm border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t.admin.chat.escalate}
                </button>
                <button
                  onClick={() => setShowCloseModal(true)}
                  disabled={selectedConv.status === 'closed'}
                  className="px-3 py-1.5 text-label-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t.admin.chat.close}
                </button>
              </div>
            </div>

            {/* User Info Bar */}
            <div className="px-4 py-2 bg-cool-slate-50 border-b border-cool-slate-200 flex items-center gap-4 text-label-sm text-cool-slate-600 shrink-0">
              {selectedConv.user_email && (
                <span>{t.admin.chat.conversation.email}: {selectedConv.user_email}</span>
              )}
              {selectedConv.booking_reference && (
                <span>{t.admin.chat.conversation.bookingReference}: {selectedConv.booking_reference}</span>
              )}
              <span>
                {t.admin.chat.conversation.channel}:{' '}
                {selectedConv.channel === 'whatsapp' ? (
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                    📱 WhatsApp
                  </span>
                ) : selectedConv.channel === 'n8n' ? (
                  <span className="inline-flex items-center gap-1 text-purple-600 font-medium">
                    🔗 n8n
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                    🌐 Web
                  </span>
                )}
              </span>
              {selectedConv.ai_confidence !== null && (
                <span>AI: {(selectedConv.ai_confidence * 100).toFixed(0)}%</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMsg ? (
                <div className="text-center text-cool-slate-400 py-8">{t.common.loading}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-cool-slate-400 py-8">{t.admin.chat.noMessages}</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${
                      msg.sender_type === 'user' ? 'order-1' : ''
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-label-sm text-cool-slate-400">
                          {msg.sender_type === 'ai' ? '🤖 AI' : msg.sender_type === 'agent' ? (msg.agent_name || '🧑‍💼 Agent') : msg.sender_type === 'system' ? '⚙️ System' : selectedConv.user_name || '👤 User'}
                        </span>
                        {msg.metadata && (() => {
                          try {
                            const meta = JSON.parse(msg.metadata)
                            if (meta.source === 'whatsapp') {
                              return <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-600">📱 WA</span>
                            }
                          } catch { /* ignore */ }
                          return null
                        })()}
                        <span className="text-label-sm text-cool-slate-400">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2 text-body-md ${
                        msg.sender_type === 'user'
                          ? 'bg-slate-navy text-white rounded-br-md'
                          : msg.sender_type === 'system'
                          ? 'bg-amber-50 text-amber-800 italic rounded-bl-md'
                          : msg.sender_type === 'agent'
                          ? 'bg-golden-sol/10 text-slate-navy border border-golden-sol/30 rounded-bl-md'
                          : 'bg-cool-slate-100 text-slate-navy rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-cool-slate-200 p-3 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.admin.chat.typeMessage}
                  disabled={selectedConv.status === 'closed' || isSending}
                  className="flex-1 px-4 py-2.5 border border-cool-slate-300 rounded-xl text-body-md text-slate-navy bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20 disabled:opacity-50"
                />
                <button
                  onClick={sendAsAgent}
                  disabled={!inputValue.trim() || selectedConv.status === 'closed' || isSending}
                  className="w-10 h-10 rounded-xl bg-mountain-emerald text-white flex items-center justify-center hover:bg-mountain-emerald/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Agent Management Sidebar */}
      <div className="w-64 shrink-0 flex flex-col bg-white rounded-xl shadow-sm border border-cool-slate-100 overflow-hidden">
        <div className="p-3 border-b border-cool-slate-200 flex items-center justify-between">
          <h3 className="text-label-md text-slate-navy font-semibold">{t.admin.chat.agents.title}</h3>
          <button
            onClick={() => { setEditingAgent(null); setShowAgentModal(true) }}
            className="text-label-sm text-mountain-emerald hover:underline"
          >
            {t.admin.chat.agents.addAgent}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="p-3 text-center text-cool-slate-400 text-label-sm">{t.admin.chat.agents.noAgents}</div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 border-b border-cool-slate-100 hover:bg-cool-slate-50 cursor-pointer"
                onClick={() => { setEditingAgent(agent); setShowAgentModal(true) }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-label-sm font-bold ${
                    agent.status === 'available' ? 'bg-mountain-emerald' :
                    agent.status === 'busy' ? 'bg-golden-sol' : 'bg-cool-slate-400'
                  }`}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-md text-slate-navy truncate">{agent.name}</p>
                    <p className="text-label-sm text-cool-slate-500">{agent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-label-sm ${
                    agent.status === 'available' ? 'bg-green-100 text-green-700' :
                    agent.status === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-cool-slate-100 text-cool-slate-500'
                  }`}>
                    {t.admin.chat.agents[agent.status as keyof typeof t.admin.chat.agents] || agent.status}
                  </span>
                  <span className="text-label-sm text-cool-slate-400">
                    {t.admin.chat.agents.currentLoad
                      .replace('{current}', String(agent.current_conversations))
                      .replace('{max}', String(agent.max_conversations))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowEscalateModal(false)}>
          <div className="bg-white rounded-xl shadow-level-3 p-6 w-96 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-display-md text-slate-navy mb-2">{t.admin.chat.confirmEscalate}</h3>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder={t.admin.chat.escalateReasonPlaceholder}
              rows={3}
              className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md mt-3 focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 text-label-md text-cool-slate-600 hover:text-slate-navy"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={!escalateReason.trim()}
                className="px-4 py-2 text-label-md bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {t.admin.chat.escalate}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowCloseModal(false)}>
          <div className="bg-white rounded-xl shadow-level-3 p-6 w-96 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-display-md text-slate-navy mb-2">{t.admin.chat.confirmClose}</h3>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-label-md text-cool-slate-600 hover:text-slate-navy"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-label-md bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t.admin.chat.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowAgentModal(false)}>
          <div className="bg-white rounded-xl shadow-level-3 p-6 w-96 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-display-md text-slate-navy mb-4">
              {editingAgent ? t.admin.chat.agents.editAgent : t.admin.chat.agents.addAgent}
            </h3>
            <AgentForm
              agent={editingAgent}
              onSave={handleAgentSave}
              onCancel={() => { setShowAgentModal(false); setEditingAgent(null) }}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AgentForm({
  agent,
  onSave,
  onCancel,
  t,
}: {
  agent: Agent | null
  onSave: (data: Partial<Agent>) => void
  onCancel: () => void
  t: any
}) {
  const [name, setName] = useState(agent?.name || '')
  const [email, setEmail] = useState(agent?.email || '')
  const [phone, setPhone] = useState(agent?.phone || '')
  const [status, setStatus] = useState(agent?.status || 'offline')
  const [maxConv, setMaxConv] = useState(agent?.max_conversations || 5)
  const [specs, setSpecs] = useState(agent?.specializations ? JSON.parse(agent.specializations).join(', ') : '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: agent?.id,
      name,
      email,
      phone: phone || undefined,
      status,
      maxConversations: maxConv,
      specializations: specs ? specs.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-label-sm text-slate-navy block mb-1">{t.admin.chat.agents.name}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
        />
      </div>
      <div>
        <label className="text-label-sm text-slate-navy block mb-1">{t.admin.chat.agents.email}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
        />
      </div>
      <div>
        <label className="text-label-sm text-slate-navy block mb-1">{t.admin.chat.agents.phone}</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
        />
      </div>
      <div>
        <label className="text-label-sm text-slate-navy block mb-1">{t.admin.chat.agents.status}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
        >
          <option value="available">{t.admin.chat.agents.available}</option>
          <option value="busy">{t.admin.chat.agents.busy}</option>
          <option value="offline">{t.admin.chat.agents.offline}</option>
        </select>
      </div>
      <div>
        <label className="text-label-sm text-slate-navy block mb-1">{t.admin.chat.agents.maxConversations}</label>
        <input
          type="number"
          value={maxConv}
          onChange={(e) => setMaxConv(parseInt(e.target.value) || 5)}
          min={1}
          max={20}
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
        />
      </div>
      <div>
        <label className="text-label-sm text-slate-navy block mb-1">{t.admin.chat.agents.specializations}</label>
        <input
          type="text"
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder="billing, logistics, support"
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md focus:outline-none focus:border-mountain-emerald focus:ring-2 focus:ring-mountain-emerald/20"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-label-md text-cool-slate-600 hover:text-slate-navy"
        >
          {t.admin.chat.agents.cancel}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-label-md bg-slate-navy text-white rounded-lg hover:bg-slate-navy/90"
        >
          {t.admin.chat.agents.save}
        </button>
      </div>
    </form>
  )
}
