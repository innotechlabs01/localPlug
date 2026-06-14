'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { RealtimeProvider } from '@/lib/admin/realtime-context'
import { getTimeAgoI18n } from '@/lib/date-utils'

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
  ai_active: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
  escalated: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
  human_active: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
  closed: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
  normal: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
  high: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
  urgent: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
}

function formatDate(dateStr: string | null, t: any): string {
  if (!dateStr) return '-'
  const chatT = t?.admin?.chat || {}
  return getTimeAgoI18n(dateStr, { justNow: chatT.justNow, minutesAgo: chatT.minutesAgo, hoursAgo: chatT.hoursAgo, daysAgo: chatT.daysAgo })
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
  const [dateFilter, setDateFilter] = useState('')

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
      if (dateFilter) params.set('dateFrom', dateFilter)
      if (dateFilter) params.set('dateTo', dateFilter)

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
  }, [filter, search, dateFilter])

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

    // Poll for new conversations every 30s
    const pollConversations = setInterval(() => {
      if (!document.hidden) fetchConversations()
    }, 30_000)

    return () => clearInterval(pollConversations)
  }, [fetchConversations, fetchAgents])

  // Refresh relative times every 60s
  const [, setTick] = useState(0)
  useEffect(() => {
    const tick = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(tick)
  }, [])

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
        if (selectedConv) fetchMessages(selectedConv.id)
      }
    } catch (err) {
      console.error('[AdminChat] Close error:', err)
    }
  }, [selectedConv, fetchConversations, fetchMessages])

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
          releaseToAi: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
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
      <div className="w-80 shrink-0 flex flex-col bg-[#181b25] rounded-[10px] border border-[#282b38] overflow-hidden">
        <div className="p-3 border-b border-[#282b38] space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.chat.searchPlaceholder}
            className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
          />
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['all', 'whatsapp', 'web'] as ChannelFilter[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  channelFilter === ch
                    ? 'bg-[#10b981] text-white'
                    : 'bg-[#111318] text-[#9ca0b0] hover:bg-[#202330]'
                }`}
              >
                {ch === 'whatsapp' ? t.admin.chat.channelFilter.whatsapp : ch === 'web' ? t.admin.chat.channelFilter.web : t.admin.chat.channelFilter.all}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['all', 'ai_active', 'escalated', 'human_active', 'closed', 'flagged'] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-[#10b981] text-white'
                    : 'bg-[#111318] text-[#9ca0b0] hover:bg-[#202330]'
                }`}
              >
                {t.admin.chat.filters[f === 'ai_active' ? 'aiActive' : f === 'human_active' ? 'humanActive' : f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConv ? (
            <div className="p-4 text-center text-[#646880]">{t.common.loading}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-[#646880]">{t.admin.chat.noConversations}</div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-3 border-b border-[#282b38] hover:bg-[#202330] transition-all ${
                  selectedConv?.id === conv.id ? 'bg-[rgba(16,185,129,0.06)] border-l-2 border-l-[#10b981]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#f0f2f5] truncate">
                      {conv.user_name || conv.user_identifier}
                    </p>
                    <p className="text-[13px] text-[#9ca0b0] truncate mt-0.5">
                      {conv.last_message || t.admin.chat.noMessages}
                    </p>
                  </div>
                  <div className="text-[11px] text-[#646880] whitespace-nowrap">
                    {formatDate(conv.last_message_at || conv.created_at, t)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[conv.status] || STATUS_STYLES.ai_active}`}>
                    {t.admin.chat.status[conv.status as keyof typeof t.admin.chat.status] || conv.status}
                  </span>
                  {conv.channel === 'whatsapp' && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[rgba(16,185,129,0.12)] text-[#10b981]">
                      {t.admin.chat.channelWA}
                    </span>
                  )}
                  {conv.channel === 'web' && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[rgba(59,130,246,0.12)] text-[#3b82f6]">
                      {t.admin.chat.channelWeb}
                    </span>
                  )}
                  {conv.flagged === 1 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[rgba(239,68,80,0.12)] text-[#ef4450]">
                      {t.admin.chat.filters.flagged || 'Flagged'}
                    </span>
                  )}
                  {conv.priority !== 'normal' && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_STYLES[conv.priority] || ''}`}>
                      {t.admin.chat.priority[conv.priority as keyof typeof t.admin.chat.priority] || conv.priority}
                    </span>
                  )}
                  <span className="text-[11px] text-[#646880] ml-auto">
                    {t.admin.chat.conversation.messageCount.replace('{count}', String(conv.message_count))}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation View */}
      <div className="flex-1 flex flex-col bg-[#181b25] rounded-[10px] border border-[#282b38] overflow-hidden">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-[#646880]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#111318] flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-[13px]">{t.admin.chat.noConversations}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="px-4 py-3 border-b border-[#282b38] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[13px] font-semibold text-[#f0f2f5]">
                  {selectedConv.user_name || selectedConv.user_identifier}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[selectedConv.status] || STATUS_STYLES.ai_active}`}>
                    {t.admin.chat.status[selectedConv.status as keyof typeof t.admin.chat.status] || selectedConv.status}
                  </span>
                  {selectedConv.flagged === 1 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[rgba(239,68,80,0.12)] text-[#ef4450]">
                      {t.admin.chat.conversation.flagged}: {selectedConv.flag_reason || 'Yes'}
                    </span>
                  )}
                  {selectedConv.agent_name && (
                    <span className="text-[11px] text-[#9ca0b0]">
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
                    className="px-3 py-1.5 text-[11px] font-medium bg-[#10b981] text-white rounded-[6px] hover:bg-[#059669] disabled:opacity-50 transition-all"
                  >
                    {isTakingOver ? t.admin.chat.takingOver : t.admin.chat.takeOver}
                  </button>
                )}
                {selectedConv.status === 'human_active' && (
                  <button
                    onClick={handleReleaseToAI}
                    className="px-3 py-1.5 text-[11px] font-medium bg-[#10b981] text-white rounded-[6px] hover:bg-[#059669] transition-all"
                  >
                    {t.admin.chat.releaseToAI || 'AI Mode'}
                  </button>
                )}
                <button
                  onClick={() => { setShowEscalateModal(true); setEscalateReason('') }}
                  disabled={selectedConv.status === 'human_active' || selectedConv.status === 'closed'}
                  className="px-3 py-1.5 text-[11px] font-medium border border-[rgba(245,158,11,0.3)] text-[#f59e0b] rounded-[6px] hover:bg-[rgba(245,158,11,0.12)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t.admin.chat.escalate}
                </button>
                <button
                  onClick={() => setShowCloseModal(true)}
                  disabled={selectedConv.status === 'closed'}
                  className="px-3 py-1.5 text-[11px] font-medium border border-[rgba(239,68,80,0.3)] text-[#ef4450] rounded-[6px] hover:bg-[rgba(239,68,80,0.12)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t.admin.chat.close}
                </button>
              </div>
            </div>

            {/* User Info Bar */}
            <div className="px-4 py-2 bg-[#111318] border-b border-[#282b38] flex items-center gap-4 text-[11px] text-[#9ca0b0] shrink-0">
              {selectedConv.user_email && (
                <span>{t.admin.chat.conversation.email}: {selectedConv.user_email}</span>
              )}
              {selectedConv.booking_reference && (
                <span>{t.admin.chat.conversation.bookingReference}: {selectedConv.booking_reference}</span>
              )}
              <span>
                {t.admin.chat.conversation.channel}:{' '}
                {selectedConv.channel === 'whatsapp' ? (
                  <span className="inline-flex items-center gap-1 text-[#10b981] font-medium">
                    {t.admin.chat.channelWhatsapp}
                  </span>
                ) : selectedConv.channel === 'n8n' ? (
                  <span className="inline-flex items-center gap-1 text-[#8b5cf6] font-medium">
                    {t.admin.chat.channelN8n}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#3b82f6] font-medium">
                    {t.admin.chat.channelWeb}
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
                <div className="text-center text-[#646880] py-8">{t.common.loading}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-[#646880] py-8">{t.admin.chat.noMessages}</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${
                      msg.sender_type === 'user' ? 'order-1' : ''
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-[#646880]">
                          {msg.sender_type === 'ai' ? t.admin.chat.senderAI : msg.sender_type === 'agent' ? (msg.agent_name || t.admin.chat.senderAgent) : msg.sender_type === 'system' ? t.admin.chat.senderSystem : selectedConv.user_name || t.admin.chat.senderUser}
                        </span>
                        {msg.metadata && (() => {
                          try {
                            const meta = JSON.parse(msg.metadata)
                            if (meta.source === 'whatsapp') {
                              return <span className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(16,185,129,0.12)] text-[#10b981]">{t.admin.chat.channelWA}</span>
                            }
                          } catch { /* ignore */ }
                          return null
                        })()}
                        <span className="text-[11px] text-[#646880]">
                          {formatDate(msg.created_at, t)}
                        </span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2 text-[13px] ${
                        msg.sender_type === 'user'
                          ? 'bg-[#10b981] text-white rounded-br-md'
                          : msg.sender_type === 'system'
                          ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] italic rounded-bl-md'
                          : msg.sender_type === 'agent'
                          ? 'bg-[rgba(212,168,75,0.1)] text-[#f0f2f5] border border-[rgba(212,168,75,0.3)] rounded-bl-md'
                          : 'bg-[#202330] text-[#f0f2f5] rounded-bl-md'
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
            <div className="border-t border-[#282b38] p-3 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.admin.chat.typeMessage}
                  disabled={selectedConv.status === 'closed' || isSending}
                  className="flex-1 px-4 py-2.5 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all disabled:opacity-50"
                />
                <button
                  onClick={sendAsAgent}
                  disabled={!inputValue.trim() || selectedConv.status === 'closed' || isSending}
                  className="w-10 h-10 rounded-[6px] bg-[#10b981] text-white flex items-center justify-center hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
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
      <div className="w-64 shrink-0 flex flex-col bg-[#181b25] rounded-[10px] border border-[#282b38] overflow-hidden">
        <div className="p-3 border-b border-[#282b38] flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#f0f2f5]">{t.admin.chat.agents.title}</h3>
          <button
            onClick={() => { setEditingAgent(null); setShowAgentModal(true) }}
            className="text-[11px] font-medium text-[#10b981] hover:underline"
          >
            {t.admin.chat.agents.addAgent}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="p-3 text-center text-[#646880] text-[11px]">{t.admin.chat.agents.noAgents}</div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 border-b border-[#282b38] hover:bg-[#202330] cursor-pointer"
                onClick={() => { setEditingAgent(agent); setShowAgentModal(true) }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
                    agent.status === 'available' ? 'bg-[#10b981]' :
                    agent.status === 'busy' ? 'bg-[#d4a84b]' : 'bg-[#646880]'
                  }`}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#f0f2f5] truncate">{agent.name}</p>
                    <p className="text-[11px] text-[#9ca0b0]">{agent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    agent.status === 'available' ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' :
                    agent.status === 'busy' ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]' : 'bg-[rgba(100,104,128,0.12)] text-[#646880]'
                  }`}>
                    {t.admin.chat.agents[agent.status as keyof typeof t.admin.chat.agents] || agent.status}
                  </span>
                  <span className="text-[11px] text-[#646880]">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowEscalateModal(false)}>
          <div className="bg-[#181b25] border border-[#282b38] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 w-96 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#f0f2f5] mb-2">{t.admin.chat.confirmEscalate}</h3>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder={t.admin.chat.escalateReasonPlaceholder}
              rows={3}
              className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all mt-3 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#9ca0b0] hover:text-[#f0f2f5] transition-colors"
              >
                {t.admin.chat.agents?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleEscalate}
                disabled={!escalateReason.trim()}
                className="px-4 py-2 text-[13px] font-medium bg-[#f59e0b] text-white rounded-[6px] hover:bg-[#d97706] disabled:opacity-50 transition-all"
              >
                {t.admin.chat.escalate}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCloseModal(false)}>
          <div className="bg-[#181b25] border border-[#282b38] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 w-96 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#f0f2f5] mb-2">{t.admin.chat.confirmClose}</h3>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#9ca0b0] hover:text-[#f0f2f5] transition-colors"
              >
                {t.admin.chat.agents?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-[13px] font-medium bg-[#ef4450] text-white rounded-[6px] hover:bg-[#dc2626] transition-all"
              >
                {t.admin.chat.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAgentModal(false)}>
          <div className="bg-[#181b25] border border-[#282b38] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 w-96 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-[#f0f2f5] mb-4">
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
        <label className="text-[11px] font-medium text-[#9ca0b0] block mb-1">{t.admin.chat.agents.name}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-[#9ca0b0] block mb-1">{t.admin.chat.agents.email}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-[#9ca0b0] block mb-1">{t.admin.chat.agents.phone}</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-[#9ca0b0] block mb-1">{t.admin.chat.agents.status}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        >
          <option value="available">{t.admin.chat.agents.available}</option>
          <option value="busy">{t.admin.chat.agents.busy}</option>
          <option value="offline">{t.admin.chat.agents.offline}</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-medium text-[#9ca0b0] block mb-1">{t.admin.chat.agents.maxConversations}</label>
        <input
          type="number"
          value={maxConv}
          onChange={(e) => setMaxConv(parseInt(e.target.value) || 5)}
          min={1}
          max={20}
          className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-[#9ca0b0] block mb-1">{t.admin.chat.agents.specializations}</label>
        <input
          type="text"
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder={t.admin.chat.specsPlaceholder || 'billing, logistics, support'}
          className="w-full px-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-all"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[13px] font-medium text-[#9ca0b0] hover:text-[#f0f2f5] transition-colors"
        >
          {t.admin.chat.agents.cancel}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-[13px] font-medium bg-[#10b981] text-white rounded-[6px] hover:bg-[#059669] transition-all"
        >
          {t.admin.chat.agents.save}
        </button>
      </div>
    </form>
  )
}
