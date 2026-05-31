'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import RatingForm from '@/app/components/ratings/RatingForm'

interface Message {
  id?: number
  sender_type: 'user' | 'ai' | 'agent' | 'system'
  content: string
  message_type: string
  created_at?: string
}

function generateUserId(): string {
  if (typeof window === 'undefined') return 'anon-' + Date.now()
  let id = localStorage.getItem('chat_user_id')
  if (!id) {
    id = 'anon-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('chat_user_id', id)
  }
  return id
}

export default function ChatWidget() {
  const { t, lang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClosed, setIsClosed] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [hasRated, setHasRated] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userId = useRef(generateUserId())
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Restore conversationId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat_conversation_id')
      if (stored) {
        setConversationId(parseInt(stored, 10))
      }
    }
  }, [])

  // Persist conversationId to localStorage
  useEffect(() => {
    if (conversationId && typeof window !== 'undefined') {
      localStorage.setItem('chat_conversation_id', String(conversationId))
    }
  }, [conversationId])

  // Detect closed status and check if rating was already submitted
  useEffect(() => {
    if (isClosed && conversationId && typeof window !== 'undefined') {
      const rated = localStorage.getItem(`rated_${conversationId}`)
      if (rated) {
        setHasRated(true)
      } else {
        setShowRating(true)
      }
    } else {
      setShowRating(false)
    }
  }, [isClosed, conversationId])

  // Fetch existing messages when opening known conversation
  useEffect(() => {
    if (isOpen && conversationId && messages.length === 0) {
      setInitialLoading(true)
      fetch(`/api/chat/messages?conversationId=${conversationId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.messages.length > 0) {
            setMessages(data.messages)
          } else {
            setMessages([{
              sender_type: 'ai',
              content: t.chatWidget.startMessage,
              message_type: 'text',
            }])
          }
        })
        .catch(() => {
          setMessages([{
            sender_type: 'ai',
            content: t.chatWidget.startMessage,
            message_type: 'text',
          }])
        })
        .finally(() => setInitialLoading(false))
    } else if (isOpen && !conversationId && messages.length === 0) {
      setMessages([{
        sender_type: 'ai',
        content: t.chatWidget.startMessage,
        message_type: 'text',
      }])
    }
  }, [isOpen, conversationId, messages.length, t])

  // Poll for new messages every 5 seconds while open
  useEffect(() => {
    if (isOpen && conversationId && !isClosed) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
          const data = await res.json()
          if (data.success) {
            setMessages(data.messages)
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
    }
  }, [isOpen, conversationId, isClosed])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, messages, scrollToBottom])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      sender_type: 'user',
      content: content.trim(),
      message_type: 'text',
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content.trim(),
          userIdentifier: userId.current,
          locale: lang,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to send')

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
        setIsClosed(false)
      }

      if (data.response) {
        setMessages(prev => [...prev, {
          sender_type: data.response.sender,
          content: data.response.content,
          message_type: data.response.type,
        }])
      }
    } catch (err) {
      setError(t.chatWidget.connectionLost)
      console.error('[ChatWidget] Send error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, isLoading, t])

  const handleEscalate = useCallback(async () => {
    if (!conversationId) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          reason: 'User requested human agent via widget',
          locale: lang,
        }),
      })

      if (res.ok) {
        setMessages(prev => [...prev, {
          sender_type: 'system',
          content: t.chatWidget.escalateConfirm,
          message_type: 'escalation',
        }])
      }
    } catch (err) {
      console.error('[ChatWidget] Escalate error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, t])

  const handleClose = useCallback(async () => {
    if (!conversationId) return
    try {
      await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          closedBy: 'user',
          locale: lang,
        }),
      })
      setIsClosed(true)
    } catch (err) {
      console.error('[ChatWidget] Close error:', err)
    }
  }, [conversationId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }, [inputValue, sendMessage])

  const statusColor = (type: string) => {
    switch (type) {
      case 'ai': return 'bg-[var(--accent-gold)]'
      case 'agent': return 'bg-[var(--accent-orange)]'
      case 'system': return 'bg-[var(--text-muted)]'
      default: return 'bg-[var(--bg-dark)]'
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 sm:bg-transparent sm:pointer-events-none" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-300 ${isOpen ? 'sm:bottom-20 sm:right-6' : ''}`}>
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-level-3 border border-cool-slate-200 w-[calc(100vw-2rem)] sm:w-96 mb-3 flex flex-col overflow-hidden animate-slide-up max-h-[70vh] sm:max-h-[600px]">
            <div className="bg-[var(--bg-dark)] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-mountain-emerald flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-label-md font-semibold">{t.chatWidget.title}</p>
                  <p className="text-label-sm text-cool-slate-400">{t.chatWidget.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-cool-slate-400 hover:text-white p-1"
                aria-label={t.chatWidget.close}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
              {initialLoading ? (
                <div className="text-center text-cool-slate-400 py-8">{t.common.loading}</div>
              ) : messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender_type !== 'user' && (
                    <div className={`w-7 h-7 rounded-full ${statusColor(msg.sender_type)} flex items-center justify-center text-white shrink-0 mt-1 mr-2`}>
                      {msg.sender_type === 'ai' || msg.sender_type === 'agent' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.sender_type === 'user' ? 'order-1' : ''}`}>
                    <div className={`rounded-2xl px-4 py-2 text-body-md ${
                      msg.sender_type === 'user'
                        ? 'bg-[var(--bg-dark)] text-white rounded-br-md'
                        : msg.sender_type === 'system'
                        ? 'bg-cool-slate-100 text-cool-slate-600 italic rounded-bl-md'
                        : msg.sender_type === 'agent'
                        ? 'bg-[var(--accent-gold)]/10 text-[var(--text-primary)] border border-[var(--accent-gold)]/30 rounded-bl-md'
                        : 'bg-cool-slate-100 text-[var(--text-primary)] rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-gold)] flex items-center justify-center text-white shrink-0 mt-1 mr-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className="bg-cool-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-cool-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cool-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cool-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-label-sm flex items-center gap-2">
                    <span>{error}</span>
                    <button onClick={() => sendMessage(inputValue)} className="underline font-semibold">
                      {t.chatWidget.retry}
                    </button>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!isClosed ? (
              <div className="border-t border-cool-slate-200 p-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chatWidget.inputPlaceholder}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 border border-cool-slate-300 rounded-xl text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-10 h-10 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-dark)] flex items-center justify-center hover:bg-[var(--accent-gold-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                    aria-label={t.chatWidget.send}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    onClick={handleEscalate}
                    disabled={isLoading || !conversationId}
                    className="text-label-sm text-cool-slate-500 hover:text-[var(--accent-gold)] disabled:opacity-50 transition-colors"
                  >
                    {t.chatWidget.escalateToHuman}
                  </button>
                </div>
              </div>
            ) : showRating && !hasRated ? (
              <div className="border-t border-cool-slate-200 shrink-0">
                <RatingForm
                  conversationId={conversationId!}
                  onSubmitted={() => { setHasRated(true); setShowRating(false) }}
                />
              </div>
            ) : (
              <div className="border-t border-cool-slate-200 p-4 text-center shrink-0">
                <p className="text-body-md text-cool-slate-500 mb-2">
                  {hasRated ? t.ratings.form.thanks : t.chatWidget.conversationClosed}
                </p>
                <button
                  onClick={() => { setIsClosed(false); setConversationId(null); setMessages([]); setShowRating(false); setHasRated(false) }}
                  className="text-label-md text-[var(--accent-gold)] hover:underline"
                >
                  {t.chatWidget.reopen}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-level-3 flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'bg-red-500 rotate-90' : 'bg-[var(--accent-gold)]'
          } text-white hover:scale-105 active:scale-95`}
          aria-label={isOpen ? t.chatWidget.close : t.chatWidget.open}
        >
          {isOpen ? (
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
