'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import RatingForm from '@/app/components/ratings/RatingForm'

interface Message {
  id?: number
  sender_type: 'user' | 'ai' | 'agent' | 'system'
  content: string
  message_type: string
  created_at?: string
}

interface ChatWidgetState {
  form: 'form' | 'chat' | 'survey' | 'closed'
  isOpen: boolean
  messages: Message[]
  inputValue: string
  isLoading: boolean
  conversationId: number | null
  error: string | null
  isClosed: boolean
  showRating: boolean
  hasRated: boolean
  initialLoading: boolean
  lastMessageAt: string | null
  inactivityWarningShown: boolean
  userPhone: string | null
  userCountry: string | null
  countryCode: string | null
}

// Helper function to generate user ID
function generateUserId(): string {
  if (typeof window === 'undefined') return 'anon-' + Date.now()
  let id = localStorage.getItem('chat_user_id')
  if (!id) {
    id = 'anon-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('chat_user_id', id)
  }
  return id
}

// Status color function
const statusColor = (type: string) => {
  switch (type) {
    case 'ai': return 'bg-[var(--accent-gold)]'
    case 'agent': return 'bg-[var(--accent-orange)]'
    case 'system': return 'bg-[var(--text-muted)]'
    default: return 'bg-[var(--bg-dark)]'
  }
}

// FormScreen component
function FormScreen({
  t,
  formData,
  handleFormChange,
  handleFormSubmit,
  isLoading,
  error
}: {
  t: any
  formData: { name: string; email: string; phone: string; country: string; countryCode: string }
  handleFormChange: (field: keyof typeof formData, value: string) => void
  handleFormSubmit: () => void
  isLoading: boolean
  error: string | null
}) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">{t.chatWidget.title}</h2>
      <p className="text-[var(--text-muted)]">{t.chatWidget.subtitle}</p>
      
      {error && (
        <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 flex items-center gap-2">
          <span>{error}</span>
          <button onClick={handleFormSubmit} className="underline font-semibold">
            {t.chatWidget.retry}
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t.chatWidget.formName}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder={t.chatWidget.formNamePlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-gray-900"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t.chatWidget.formEmail}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            placeholder={t.chatWidget.formEmailPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-gray-900"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t.chatWidget.formPhone}</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFormChange('phone', e.target.value)}
            placeholder={t.chatWidget.formPhonePlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-gray-900"
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t.chatWidget.formCountry}</label>
              <select
                value={formData.country}
                onChange={(e) => handleFormChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-gray-900"
                disabled={isLoading}
              >
                <option value="" className="text-gray-900">{t.chatWidget.formCountryPlaceholder}</option>
              {/* In a real app, we would populate this from a country list */}
              <option value="Colombia">Colombia</option>
              <option value="United States">United States</option>
              <option value="Mexico">Mexico</option>
              <option value="Spain">Spain</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t.chatWidget.formCountryCode}</label>
              <select
                value={formData.countryCode}
                onChange={(e) => handleFormChange('countryCode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-gray-900"
                disabled={isLoading}
              >
                <option value="" className="text-gray-900">{t.chatWidget.formCountryCodePlaceholder}</option>
              <option value="+57">+57 (Colombia)</option>
              <option value="+1">+1 (USA)</option>
              <option value="+52">+52 (Mexico)</option>
              <option value="+34">+34 (Spain)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleFormSubmit}
          disabled={isLoading || !formData.name || !formData.email || !formData.phone || !formData.country || !formData.countryCode}
          className="px-6 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition-colors disabled:opacity-50"
        >
          {isLoading ? t.common.loading : t.chatWidget.formSubmit}
        </button>
      </div>
    </div>
  )
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  if (isToday) return `${hours}:${mins}`
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month} ${hours}:${mins}`
}

// ChatScreen component
function ChatScreen({
  t,
  messages,
  isLoading,
  inputValue,
  sendMessage,
  handleKeyDown,
  messagesEndRef,
  error
}: {
  t: any
  messages: Message[]
  isLoading: boolean
  inputValue: string
  sendMessage: (content: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  error: string | null
}) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-[300px] max-h-[400px] bg-[#1a1a2e]">
      {messages.map((msg, i) => {
        const showTime = msg.created_at || (i > 0 && messages[i-1].sender_type !== msg.sender_type)
        return (
          <div key={msg.id || i} className={`flex items-end gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationFillMode: 'both' }}>
            {msg.sender_type === 'system' ? (
              <div className="flex justify-center w-full my-1">
                <div className="bg-[#16213e]/80 backdrop-blur-sm text-gray-400 text-label-xs px-3 py-1 rounded-full italic shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <>
                {msg.sender_type !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#16213e] shadow-sm flex items-center justify-center shrink-0 mb-0.5 border border-[#0f3460]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.sender_type === 'user' ? 'order-1' : ''}`}>
                  <div className={`relative px-3.5 py-2 text-body-md leading-relaxed whitespace-pre-wrap break-words ${
                    msg.sender_type === 'user'
                      ? 'bg-[#e94560] text-white rounded-2xl rounded-br-sm'
                      : msg.sender_type === 'agent'
                      ? 'bg-[#16213e] text-gray-200 rounded-2xl rounded-bl-sm shadow-sm border border-[#0f3460]'
                      : 'bg-[#16213e] text-gray-200 rounded-2xl rounded-bl-sm shadow-sm border border-[#0f3460]'
                  }`}>
                    {msg.content}
                    {showTime && (
                      <div className={`text-[10px] mt-1 -mb-0.5 ${msg.sender_type === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
      {isLoading && (
        <div className="flex justify-start items-end gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-8 h-8 rounded-full bg-[#16213e] shadow-sm flex items-center justify-center shrink-0 mb-0.5 border border-[#0f3460]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="bg-[#16213e] rounded-2xl rounded-bl-sm shadow-sm border border-[#0f3460] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="flex justify-center my-2">
          <div className="bg-red-50 text-red-600 rounded-lg px-3 py-1.5 text-label-xs flex items-center gap-2 shadow-sm">
            <span>{error}</span>
            <button onClick={() => sendMessage(inputValue)} className="underline font-semibold">{t.chatWidget.retry}</button>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

// SurveyScreen component
function SurveyScreen({
  t,
  conversationId,
  onRatingSubmit,
  onSurveyComplete
}: {
  t: any
  conversationId: number | null
  onRatingSubmit: () => void
  onSurveyComplete: () => void
}) {
  return (
    <div className="p-6 text-center space-y-6">
      <h2 className="text-xl font-bold">{t.chatWidget.surveyTitle}</h2>
      <p className="text-[var(--text-muted)]">{t.chatWidget.surveyDescription}</p>
      
      <div className="mx-auto max-w-sm">
        <RatingForm
          conversationId={conversationId!}
          onSubmitted={onRatingSubmit}
        />
      </div>
      
      <p className="text-sm text-[var(--text-muted)]">{t.chatWidget.surveySkip}</p>
      <button
        onClick={onSurveyComplete}
        className="px-4 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition-colors"
      >
        {t.chatWidget.surveySkipButton}
      </button>
    </div>
  )
}

// ClosedScreen component
function ClosedScreen({
  t,
  onReopen
}: {
  t: any
  onReopen: () => void
}) {
  return (
    <div className="p-6 text-center space-y-4">
      <h2 className="text-xl font-bold">{t.chatWidget.thanksTitle}</h2>
      <p className="text-[var(--text-muted)]">{t.chatWidget.thanksMessage}</p>
      <button
        onClick={onReopen}
        className="px-6 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-gold-dark transition-colors"
      >
        {t.chatWidget.startNewChat}
      </button>
    </div>
  )
}

export default function ChatWidget() {
  const { t, lang } = useI18n()
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  const [state, setState] = useState<ChatWidgetState>({
    form: 'form',
    isOpen: false,
    messages: [],
    inputValue: '',
    isLoading: false,
    conversationId: null,
    error: null,
    isClosed: false,
    showRating: false,
    hasRated: false,
    initialLoading: false,
    lastMessageAt: null,
    inactivityWarningShown: false,
    userPhone: null,
    userCountry: null,
    countryCode: null
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userId = useRef(generateUserId())
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityWarningRef = useRef<NodeJS.Timeout | null>(null)

  // Form screen state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    countryCode: ''
  })

  // Handle form input changes
  const handleFormChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.country || !formData.countryCode) {
      setState(prev => ({ ...prev, error: t.common.tryAgain }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          countryCode: formData.countryCode,
          locale: lang
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to start conversation')

      if (data.success && data.conversationId) {
        setFormData({ name: '', email: '', phone: '', country: '', countryCode: '' })
        setState(prev => ({ 
          ...prev, 
          form: 'chat', 
          conversationId: data.conversationId,
          isLoading: false,
          lastMessageAt: new Date().toISOString(),
          inactivityWarningShown: false,
          userPhone: formData.phone,
          userCountry: formData.country,
          countryCode: formData.countryCode,
        }))

        // Fetch welcome message from DB to avoid duplication
        const msgRes = await fetch(`/api/chat/messages?conversationId=${data.conversationId}`)
        const msgData = await msgRes.json()
        if (msgData.success && msgData.messages.length > 0) {
          setState(prev => ({ ...prev, messages: msgData.messages }))
        }
      }
    } catch (err) {
      console.error('[ChatWidget] Form submit error:', err)
      setState(prev => ({ ...prev, isLoading: false, error: t.chatWidget.connectionLost }))
    }
  }, [formData, lang, t])

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Inactivity monitoring functions
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
    if (inactivityWarningRef.current) {
      clearTimeout(inactivityWarningRef.current)
      inactivityWarningRef.current = null
    }
    
    // Reset warning flag
    setState(prev => ({ ...prev, inactivityWarningShown: false }))
    
    // Set new timers (60s warning, 90s close)
    inactivityWarningRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, inactivityWarningShown: true }))
      
      // Add inactivity warning message
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          sender_type: 'system',
          content: t.chatWidget.inactivityWarning,
          message_type: 'system',
        }]
      }))
    }, 60000) // 60 seconds
    
    inactivityTimeoutRef.current = setTimeout(() => {
      // Close conversation due to inactivity
      handleClose()
      
      // Add inactivity close message
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          sender_type: 'system',
          content: t.chatWidget.inactivityClosed,
          message_type: 'system',
        }]
      }))
    }, 90000) // 90 seconds
  }, [t, inactivityTimeoutRef, inactivityWarningRef])

  // Handle sending messages
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return

    const userMessage: Message = {
      sender_type: 'user',
      content: content.trim(),
      message_type: 'text',
    }

    setState(prev => ({ ...prev, messages: [...prev.messages, userMessage], inputValue: '' }))
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: state.conversationId,
          message: content.trim(),
          userIdentifier: userId.current,
          locale: lang,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to send')

      if (data.conversationId && !state.conversationId) {
        setState(prev => ({ ...prev, conversationId: data.conversationId, isClosed: false }))
      }

      if (data.response) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            sender_type: data.response.sender,
            content: data.response.content,
            message_type: data.response.type,
          }],
          lastMessageAt: new Date().toISOString()
        }))
        
        // Reset inactivity timer on agent/AI response
        resetInactivityTimer()
      } else if (data.pending) {
        // n8n is processing — polling will pick up the response when ready
        resetInactivityTimer()
      }
    } catch (err) {
      console.error('[ChatWidget] Send error:', err)
      setState(prev => ({ ...prev, error: t.chatWidget.connectionLost }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
      
      // Reset inactivity timer on user message
      resetInactivityTimer()
    }
  }, [state, t, lang, resetInactivityTimer])

  // Handle closing conversation
  const handleClose = useCallback(async () => {
    if (!state.conversationId) return
    
    try {
      await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: state.conversationId,
          closedBy: 'user',
          locale: lang,
        }),
      })
      
      setState(prev => ({ ...prev, isClosed: true }))
    } catch (err) {
      console.error('[ChatWidget] Close error:', err)
    }
  }, [state.conversationId, lang, t])

  // Handle escalating to human agent
  const handleEscalate = useCallback(async () => {
    if (!state.conversationId) return
    
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const res = await fetch('/api/chat/request-escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: state.conversationId,
          locale: lang,
        }),
      })

      if (res.ok) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            sender_type: 'system',
            content: t.chatWidget.escalateConfirm,
            message_type: 'escalation',
          }],
          isLoading: false
        }))
      }
    } catch (err) {
      console.error('[ChatWidget] Escalate error:', err)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.conversationId, lang, t])

  // Handle input change for chat message
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, inputValue: e.target.value }))
  }, [])

  // Handle key down for enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(state.inputValue)
    }
  }, [state.inputValue, sendMessage])

  // Poll for new messages every 5 seconds while open
  useEffect(() => {
    if (state.isOpen && state.conversationId && !state.isClosed) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/chat/messages?conversationId=${state.conversationId}`)
          const data = await res.json()
          if (data.success) {
            setState(prev => {
              const existingIds = new Set(prev.messages.map(m => m.id).filter(Boolean))
              const existingContent = new Set(prev.messages.map(m => `${m.content}|${m.sender_type}`))
              const newMsgs = (data.messages as any[] || []).filter(m => {
                if (m.id && existingIds.has(m.id)) return false
                if (existingContent.has(`${m.content}|${m.sender_type}`)) return false
                return true
              })
              if (newMsgs.length === 0) return prev
              const last = newMsgs[newMsgs.length - 1]
              return { ...prev, messages: [...prev.messages, ...newMsgs], lastMessageAt: last?.created_at || prev.lastMessageAt }
            })
            
            // Reset inactivity timer when we get new messages from server
            resetInactivityTimer()
          }
        } catch {
          // silent poll failure
        }
      }, 5000)
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      
      // Clear inactivity timers when component unmounts or chat closes
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }
      if (inactivityWarningRef.current) {
        clearTimeout(inactivityWarningRef.current)
        inactivityWarningRef.current = null
      }
    }
  }, [state.isOpen, state.conversationId, state.isClosed, state.lastMessageAt, resetInactivityTimer])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (state.isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [state.isOpen, state.messages, scrollToBottom])

  // Restore conversationId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat_conversation_id')
      if (stored) {
        setState(prev => ({ ...prev, conversationId: parseInt(stored, 10) }))
      }
    }
  }, [])

  // Persist conversationId to localStorage
  useEffect(() => {
    if (state.conversationId && typeof window !== 'undefined') {
      localStorage.setItem('chat_conversation_id', String(state.conversationId))
    }
  }, [state.conversationId])

  // Detect closed status and check if rating was already submitted
  useEffect(() => {
    if (state.isClosed && state.conversationId && typeof window !== 'undefined') {
      const rated = localStorage.getItem(`rated_${state.conversationId}`)
      if (rated) {
        setState(prev => ({ ...prev, hasRated: true }))
      } else {
        setState(prev => ({ ...prev, showRating: true }))
      }
    } else {
      setState(prev => ({ ...prev, showRating: false }))
    }
  }, [state.isClosed, state.conversationId])

  return (
    <>
      {state.isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 sm:bg-transparent sm:pointer-events-none" onClick={() => setState(prev => ({ ...prev, isOpen: false }))} />
      )}

      <div className={`fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-300 ${state.isOpen ? 'sm:bottom-20 sm:right-6' : ''}`}>
        {state.isOpen && (
          <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl border border-[#0f3460] w-[calc(100vw-2rem)] sm:w-96 mb-3 flex flex-col overflow-hidden animate-slide-up max-h-[70vh] sm:max-h-[600px]">
            <div className="bg-[#16213e] text-white px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setState(prev => ({ ...prev, isOpen: false }))}
                  className="text-white/80 hover:text-white p-0.5 -ml-1"
                  aria-label={t.chatWidget.close}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </button>
                <div>
                  <p className="text-sm font-medium">{t.chatWidget.title}</p>
                  <p className="text-[11px] text-white/70">{t.chatWidget.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Render appropriate screen based on state */}
            {state.form === 'form' && (
              <FormScreen
                t={t}
                formData={formData}
                handleFormChange={handleFormChange}
                handleFormSubmit={handleFormSubmit}
                isLoading={state.isLoading}
                error={state.error}
              />
            )}
            
            {state.form === 'chat' && (
              <>
                <ChatScreen
                  t={t}
                  messages={state.messages}
                  isLoading={state.isLoading}
                  inputValue={state.inputValue}
                  sendMessage={sendMessage}
                  handleKeyDown={handleKeyDown}
                  messagesEndRef={messagesEndRef}
                  error={state.error}
                />
                <div className="bg-[#16213e] px-3 py-2.5 flex items-center gap-2 shrink-0 border-t border-[#0f3460]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={state.inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chatWidget.inputPlaceholder}
                    className="flex-1 px-4 py-2.5 bg-[#1a1a2e] rounded-full border border-[#0f3460] focus:outline-none focus:ring-2 focus:ring-[#e94560] text-white placeholder-gray-500 text-sm shadow-sm"
                    disabled={state.isLoading || state.isClosed}
                  />
                  <button
                    onClick={() => sendMessage(state.inputValue)}
                    disabled={state.isLoading || state.isClosed || !state.inputValue.trim()}
                    className="w-10 h-10 rounded-full bg-[#e94560] text-white flex items-center justify-center shrink-0 hover:bg-[#d63851] transition-colors disabled:opacity-40 shadow-sm"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
            
            {state.form === 'survey' && (
              <SurveyScreen
                t={t}
                conversationId={state.conversationId!}
                onRatingSubmit={() => {
                  setState(prev => ({ 
                    ...prev, 
                    hasRated: true, 
                    showRating: false,
                    form: 'closed'
                  }))
                  // Save rating to localStorage to prevent showing again
                  if (state.conversationId) {
                    localStorage.setItem(`rated_${state.conversationId}`, 'true')
                  }
                }}
                onSurveyComplete={() => {
                  setState(prev => ({ 
                    ...prev, 
                    form: 'closed' 
                  }))
                }}
              />
            )}
            
            {state.form === 'closed' && (
              <ClosedScreen
                t={t}
                onReopen={() => {
                  setState(prev => ({ 
                    ...prev, 
                    form: 'form',
                    isClosed: false,
                    conversationId: null,
                    messages: [],
                    inputValue: '',
                    isLoading: false,
                    error: null,
                    showRating: false,
                    hasRated: false,
                    initialLoading: false,
                    lastMessageAt: null,
                    inactivityWarningShown: false,
                    userPhone: null,
                    userCountry: null,
                    countryCode: null
                  }))
                  // Clear form data
                  setFormData({ name: '', email: '', phone: '', country: '', countryCode: '' })
                }}
              />
            )}
          </div>
        )}

        <button
          onClick={() => setState(prev => ({ ...prev, isOpen: !state.isOpen }))}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            state.isOpen ? 'bg-[#e94560] rotate-90' : 'bg-[#e94560]'
          } text-white hover:scale-105 active:scale-95`}
          aria-label={state.isOpen ? t.chatWidget.close : t.chatWidget.open}
        >
          {state.isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}