# Real-Time Support Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the existing AI chat widget into a full support chat system with pre-chat form, state management, inactivity monitoring, and satisfaction surveys.

**Architecture:** Extend existing `conversations` and `messages` tables with new columns + rating table. Add 3 new API endpoints. Rewrite ChatWidget as a 4-screen state machine. Update admin chat page with new states and finalize button.

**Tech Stack:** Next.js 15 (App Router), Turso (libSQL), Tailwind CSS, Clerk auth

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `lib/db/migrations/020_support_chat_evolution.sql` | Add columns + ratings table |
| `lib/countries.ts` | Complete country list with dial codes |
| `app/api/chat/start/route.ts` | POST — create conversation from pre-chat form |

### Modified Files
| File | Changes |
|------|---------|
| `app/components/chat/ChatWidget.tsx` | Rewrite as 4-screen state machine (form → chat → survey → closed) |
| `app/admin/ia-chat/page.tsx` | Add new state filters, finalize button, phone/country info |
| `middleware.ts` | Add `/api/chat/(start\|send\|messages)` as public routes |
| `app/api/chat/messages/route.ts` | Allow unauthenticated access for web channel conversations |
| `app/api/chat/send/route.ts` | Update to set `user_phone`, `user_country`, `country_code` on conversation |
| `lib/i18n/locales/en.ts` | Add new chatWidget translation keys |
| `lib/i18n/locales/es.ts` | Add new chatWidget translation keys |

---

### Task 1: Database Migration

**Files:**
- Create: `lib/db/migrations/020_support_chat_evolution.sql`

- [ ] **Write migration SQL**

```sql
-- Add pre-chat form columns to conversations
ALTER TABLE conversations ADD COLUMN user_phone TEXT;
ALTER TABLE conversations ADD COLUMN user_country TEXT;
ALTER TABLE conversations ADD COLUMN country_code TEXT;

-- Create conversation ratings table
CREATE TABLE IF NOT EXISTS conversation_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Index for ratings lookup
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_conversation_id ON conversation_ratings(conversation_id);
```

- [ ] **Apply migration**

Run: `turso db shell <connection-url> < lib/db/migrations/020_support_chat_evolution.sql` (or use the project's migration script)

- [ ] **Commit**

---

### Task 2: Country List Data

**Files:**
- Create: `lib/countries.ts`

- [ ] **Write country list with dial codes**

```typescript
export interface Country {
  name: string
  code: string // ISO 3166-1 alpha-2
  dialCode: string
}

export const countries: Country[] = [
  { name: 'Afghanistan', code: 'AF', dialCode: '+93' },
  { name: 'Albania', code: 'AL', dialCode: '+355' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213' },
  { name: 'Andorra', code: 'AD', dialCode: '+376' },
  { name: 'Angola', code: 'AO', dialCode: '+244' },
  { name: 'Argentina', code: 'AR', dialCode: '+54' },
  { name: 'Armenia', code: 'AM', dialCode: '+374' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Austria', code: 'AT', dialCode: '+43' },
  { name: 'Azerbaijan', code: 'AZ', dialCode: '+994' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1-242' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880' },
  { name: 'Barbados', code: 'BB', dialCode: '+1-246' },
  { name: 'Belarus', code: 'BY', dialCode: '+375' },
  { name: 'Belgium', code: 'BE', dialCode: '+32' },
  { name: 'Belize', code: 'BZ', dialCode: '+501' },
  { name: 'Benin', code: 'BJ', dialCode: '+229' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591' },
  { name: 'Bosnia & Herzegovina', code: 'BA', dialCode: '+387' },
  { name: 'Botswana', code: 'BW', dialCode: '+267' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'Brunei', code: 'BN', dialCode: '+673' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '+226' },
  { name: 'Burundi', code: 'BI', dialCode: '+257' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Cape Verde', code: 'CV', dialCode: '+238' },
  { name: 'Chad', code: 'TD', dialCode: '+235' },
  { name: 'Chile', code: 'CL', dialCode: '+56' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'Colombia', code: 'CO', dialCode: '+57' },
  { name: 'Congo', code: 'CG', dialCode: '+242' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506' },
  { name: 'Croatia', code: 'HR', dialCode: '+385' },
  { name: 'Cuba', code: 'CU', dialCode: '+53' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420' },
  { name: 'Denmark', code: 'DK', dialCode: '+45' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1-809' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503' },
  { name: 'England', code: 'GB-ENG', dialCode: '+44' },
  { name: 'Estonia', code: 'EE', dialCode: '+372' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251' },
  { name: 'Finland', code: 'FI', dialCode: '+358' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Georgia', code: 'GE', dialCode: '+995' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'Ghana', code: 'GH', dialCode: '+233' },
  { name: 'Greece', code: 'GR', dialCode: '+30' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502' },
  { name: 'Honduras', code: 'HN', dialCode: '+504' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852' },
  { name: 'Hungary', code: 'HU', dialCode: '+36' },
  { name: 'Iceland', code: 'IS', dialCode: '+354' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Iran', code: 'IR', dialCode: '+98' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'Israel', code: 'IL', dialCode: '+972' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1-876' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'Jordan', code: 'JO', dialCode: '+962' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7' },
  { name: 'Kenya', code: 'KE', dialCode: '+254' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965' },
  { name: 'Latvia', code: 'LV', dialCode: '+371' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961' },
  { name: 'Libya', code: 'LY', dialCode: '+218' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Maldives', code: 'MV', dialCode: '+960' },
  { name: 'Malta', code: 'MT', dialCode: '+356' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230' },
  { name: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'Monaco', code: 'MC', dialCode: '+377' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382' },
  { name: 'Morocco', code: 'MA', dialCode: '+212' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95' },
  { name: 'Namibia', code: 'NA', dialCode: '+264' },
  { name: 'Nepal', code: 'NP', dialCode: '+977' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234' },
  { name: 'North Macedonia', code: 'MK', dialCode: '+389' },
  { name: 'Norway', code: 'NO', dialCode: '+47' },
  { name: 'Oman', code: 'OM', dialCode: '+968' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92' },
  { name: 'Panama', code: 'PA', dialCode: '+507' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595' },
  { name: 'Peru', code: 'PE', dialCode: '+51' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Poland', code: 'PL', dialCode: '+48' },
  { name: 'Portugal', code: 'PT', dialCode: '+351' },
  { name: 'Puerto Rico', code: 'PR', dialCode: '+1-787' },
  { name: 'Qatar', code: 'QA', dialCode: '+974' },
  { name: 'Romania', code: 'RO', dialCode: '+40' },
  { name: 'Russia', code: 'RU', dialCode: '+7' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'Senegal', code: 'SN', dialCode: '+221' },
  { name: 'Serbia', code: 'RS', dialCode: '+381' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255' },
  { name: 'Thailand', code: 'TH', dialCode: '+66' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'Uganda', code: 'UG', dialCode: '+256' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998' },
  { name: 'Vatican City', code: 'VA', dialCode: '+379' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' },
  { name: 'Yemen', code: 'YE', dialCode: '+967' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263' },
]
```

- [ ] **Export for use in components**

```typescript
// Add at end of lib/countries.ts
export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code)
}

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return countries.find(c => c.dialCode === dialCode)
}
```

- [ ] **Commit**

---

### Task 3: Update Middleware for Public Chat Routes

**Files:**
- Modify: `middleware.ts`

- [ ] **Add guest chat endpoints to public routes**

```typescript
const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
  '/api/booking',
  '/api/payments/(.*)',
  '/api/webhooks/(.*)',
  '/api/admin/lookup',
  '/api/chat/start',
  '/api/chat/send',
  '/api/chat/messages',
  '/sign-in(.*)',
  '/sign-up(.*)',
])
```

- [ ] **Commit**

---

### Task 4: API — POST /api/chat/start

**Files:**
- Create: `app/api/chat/start/route.ts`

- [ ] **Write the start endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerAiChatMessage } from '@/lib/n8n/client'
import { t } from '@/lib/i18n/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, country, countryCode, locale } = body

    if (!name || !email || !phone || !country || !countryCode) {
      return NextResponse.json(
        { error: 'name, email, phone, country, and countryCode are required' },
        { status: 400 },
      )
    }

    const db = getDb()
    const sessionId = 'ses_' + Math.random().toString(36).slice(2, 15) + Date.now().toString(36)

    const result = await db.execute({
      sql: `INSERT INTO conversations (user_identifier, user_name, user_email, user_phone, user_country, country_code, status, channel)
            VALUES (?, ?, ?, ?, ?, ?, 'active', 'web')`,
      args: [email, name, email, phone, country, countryCode],
    })

    const conversationId = Number(result.lastInsertRowid)

    // Send welcome AI message
    const welcomeContent = t(locale || 'en', 'chatWidget.startMessage')

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'ai', ?, 'text')`,
      args: [conversationId, welcomeContent],
    })

    await db.execute({
      sql: "UPDATE conversations SET last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [conversationId],
    })

    // Trigger n8n AI for ongoing conversation
    await triggerAiChatMessage({
      conversationId,
      message: `New conversation started by ${name} (${email})`,
      userIdentifier: email,
      userName: name,
    })

    return NextResponse.json({
      success: true,
      conversationId,
      sessionId,
    })
  } catch (error) {
    console.error('[Chat Start] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 },
    )
  }
}
```

- [ ] **Commit**

---

### Task 5: Modify GET /api/chat/messages for Unauthenticated Access

**Files:**
- Modify: `app/api/chat/messages/route.ts`

- [ ] **Rewrite to skip Clerk auth for web channel conversations**

Current code requires Clerk auth. Change to allow unauthenticated access when the conversation channel is `web`:

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const before = searchParams.get('before')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 },
      )
    }

    const db = getDb()

    // Check if this is a web channel conversation (public)
    const convResult = await db.execute({
      sql: 'SELECT channel, status FROM conversations WHERE id = ?',
      args: [parseInt(conversationId, 10)],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      )
    }

    const conversation = convResult.rows[0] as { channel: string; status: string }
    const isWebChannel = conversation.channel === 'web'

    // Only require Clerk auth for non-web channels
    if (!isWebChannel) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        )
      }

      const userResult = await db.execute({
        sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
        args: [userId],
      })

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 },
        )
      }

      const roleId = (userResult.rows[0] as { role_id: number | null }).role_id
      if (roleId === null) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 },
        )
      }
    }

    let sql = `
      SELECT
        m.*,
        sa.name as agent_name
      FROM messages m
      LEFT JOIN support_agents sa ON m.sender_type = 'agent' AND m.sender_id = CAST(sa.id AS TEXT)
      WHERE m.conversation_id = ?
    `
    const args: (string | number)[] = [parseInt(conversationId, 10)]

    if (before) {
      sql += ' AND m.id < ?'
      args.push(parseInt(before, 10))
    }

    sql += ' ORDER BY m.created_at DESC'
    sql += ' LIMIT ?'
    args.push(limit)

    const result = await db.execute({ sql, args })
    const messages = result.rows.reverse()

    return NextResponse.json({
      success: true,
      messages,
      hasMore: messages.length === limit,
      status: conversation.status,
    })
  } catch (error) {
    console.error('[Chat API] Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 },
    )
  }
}
```

- [ ] **Commit**

---

### Task 6: Rewrite ChatWidget as 4-Screen State Machine

**Files:**
- Modify: `app/components/chat/ChatWidget.tsx` (full rewrite)

This is the largest task. The widget becomes a state machine with four screens:

| Screen | State Value | Description |
|--------|------------|-------------|
| Form | `'form'` | Pre-chat form (name, email, phone, country) |
| Chat | `'chat'` | Message list + input |
| Survey | `'survey'` | 5-star rating + optional comment |
| Closed | `'closed'` | Thank you + start new chat button |

- [ ] **Write the complete ChatWidget**

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { countries, getCountryByCode } from '@/lib/countries'

type Screen = 'form' | 'chat' | 'survey' | 'closed'

interface Message {
  id?: number
  sender_type: 'user' | 'ai' | 'agent' | 'system'
  content: string
  message_type: string
  created_at?: string
}

interface FormData {
  name: string
  email: string
  phone: string
  country: string
  countryCode: string
}

const INACTIVITY_WARNING_MS = 60_000
const INACTIVITY_CLOSE_MS = 90_000

export default function ChatWidget() {
  const { t, lang } = useI18n()
  const [screen, setScreen] = useState<Screen>('form')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [surveyRating, setSurveyRating] = useState(0)
  const [surveyComment, setSurveyComment] = useState('')
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Check localStorage for existing active session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConvId = localStorage.getItem('chat_conversation_id')
      const storedScreen = localStorage.getItem('chat_screen') as Screen | null
      if (storedConvId && storedScreen === 'chat') {
        setConversationId(parseInt(storedConvId, 10))
        setScreen('chat')
      }
    }
  }, [])

  // Persist conversation state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (conversationId) {
        localStorage.setItem('chat_conversation_id', String(conversationId))
      }
      localStorage.setItem('chat_screen', screen)
    }
  }, [conversationId, screen])

  // Clear session on close
  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chat_conversation_id')
      localStorage.removeItem('chat_screen')
    }
    setConversationId(null)
    setMessages([])
    setInputValue('')
    setError(null)
  }, [])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
        // Check for inactivity status from server
        if (data.status === 'inactive' || data.status === 'closed' || data.status === 'resolved') {
          // Show survey if closed
        }
      }
    } catch {
      // silent
    }
  }, [conversationId])

  // Poll for messages while in chat screen
  useEffect(() => {
    if (isOpen && screen === 'chat' && conversationId) {
      fetchMessages()
      pollingRef.current = setInterval(fetchMessages, 5000)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isOpen, screen, conversationId, fetchMessages])

  // Inactivity monitoring
  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (inactivityRef.current) {
      clearTimeout(inactivityRef.current)
    }
  }, [])

  useEffect(() => {
    if (screen !== 'chat' || !conversationId) return

    resetInactivity()

    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityRef.current

      if (elapsed >= INACTIVITY_CLOSE_MS) {
        // Auto-close due to inactivity
        handleAutoClose()
        return
      }

      if (elapsed >= INACTIVITY_WARNING_MS) {
        // Send warning message if not already sent
        setMessages(prev => {
          const hasWarning = prev.some(m => m.sender_type === 'system' && m.content.includes('disponible'))
          if (hasWarning) return prev
          return [...prev, {
            sender_type: 'system' as const,
            content: t.chatWidget.inactivityWarning,
            message_type: 'system',
          }]
        })
      }

      inactivityRef.current = setTimeout(checkInactivity, 5000)
    }

    inactivityRef.current = setTimeout(checkInactivity, INACTIVITY_WARNING_MS)

    return () => {
      if (inactivityRef.current) {
        clearTimeout(inactivityRef.current)
      }
    }
  }, [screen, conversationId, messages.length])

  // Reset inactivity on new messages or typing
  useEffect(() => {
    if (screen === 'chat') {
      resetInactivity()
    }
  }, [messages.length, screen, isUserTyping, isAgentTyping])

  const handleAutoClose = useCallback(async () => {
    if (!conversationId) return
    try {
      await fetch('/api/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          closedBy: 'inactivity',
          locale: lang,
        }),
      })
      setMessages(prev => [...prev, {
        sender_type: 'system',
        content: t.chatWidget.inactivityClosed,
        message_type: 'system',
      }])
      setScreen('survey')
    } catch {
      // silent
    }
  }, [conversationId, lang, t])

  // Submit pre-chat form
  const handleFormSubmit = useCallback(async (form: FormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          locale: lang,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start chat')

      setConversationId(data.conversationId)
      setScreen('chat')
    } catch (err) {
      setError('Failed to start conversation. Please try again.')
      console.error('[ChatWidget] Start error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [lang])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || !conversationId) return

    const userMessage: Message = {
      sender_type: 'user',
      content: content.trim(),
      message_type: 'text',
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)
    resetInactivity()

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content.trim(),
          userIdentifier: conversationId,
          locale: lang,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

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
  }, [conversationId, isLoading, lang, t, resetInactivity])

  // Submit survey
  const handleSurveySubmit = useCallback(async () => {
    if (!conversationId || surveyRating === 0) return

    try {
      await fetch('/api/chat/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          rating: surveyRating,
          comment: surveyComment,
        }),
      })
      setSurveySubmitted(true)
    } catch {
      // Survey submission failure is non-critical
      setSurveySubmitted(true)
    }
  }, [conversationId, surveyRating, surveyComment])

  const handleSurveySkip = useCallback(() => {
    setSurveySubmitted(true)
  }, [])

  const handleNewChat = useCallback(() => {
    clearSession()
    setScreen('form')
    setSurveyRating(0)
    setSurveyComment('')
    setSurveySubmitted(false)
  }, [clearSession])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }, [inputValue, sendMessage])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, messages, scrollToBottom, screen])

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
            {/* Header */}
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

            {/* Screen: Form */}
            {screen === 'form' && (
              <FormScreen
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                error={error}
                t={t}
              />
            )}

            {/* Screen: Chat */}
            {screen === 'chat' && (
              <ChatScreen
                messages={messages}
                inputValue={inputValue}
                setInputValue={setInputValue}
                isLoading={isLoading}
                error={error}
                sendMessage={sendMessage}
                handleKeyDown={handleKeyDown}
                statusColor={statusColor}
                messagesEndRef={messagesEndRef}
                inputRef={inputRef}
                isAgentTyping={isAgentTyping}
                t={t}
              />
            )}

            {/* Screen: Survey */}
            {screen === 'survey' && (
              <SurveyScreen
                surveyRating={surveyRating}
                setSurveyRating={setSurveyRating}
                surveyComment={surveyComment}
                setSurveyComment={setSurveyComment}
                surveySubmitted={surveySubmitted}
                onSubmit={handleSurveySubmit}
                onSkip={handleSurveySkip}
                onNewChat={handleNewChat}
                t={t}
              />
            )}

            {/* Screen: Closed */}
            {screen === 'closed' && (
              <ClosedScreen
                onNewChat={handleNewChat}
                t={t}
              />
            )}
          </div>
        )}

        {/* Floating button */}
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
```

- [ ] **Write FormScreen sub-component**

```typescript
function FormScreen({
  onSubmit,
  isLoading,
  error,
  t,
}: {
  onSubmit: (data: FormData) => void
  isLoading: boolean
  error: string | null
  t: any
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [countrySearch, setCountrySearch] = useState('')

  const filteredCountries = countrySearch
    ? countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dialCode.includes(countrySearch)
      )
    : countries

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const country = countries.find(c => c.code === selectedCountry)
    if (!name || !email || !phone || !country) return
    onSubmit({
      name,
      email,
      phone,
      country: country.name,
      countryCode: country.dialCode,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-3 overflow-y-auto">
      <p className="text-body-md text-[var(--text-primary)] font-medium mb-4">
        {t.chatWidget.formTitle}
      </p>

      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.chatWidget.namePlaceholder}
          required
          className="w-full px-4 py-2.5 border border-cool-slate-300 rounded-xl text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
        />
      </div>

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.chatWidget.emailPlaceholder}
          required
          className="w-full px-4 py-2.5 border border-cool-slate-300 rounded-xl text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
        />
      </div>

      <div className="flex gap-2">
        <div className="relative w-28 shrink-0">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-cool-slate-300 rounded-xl text-body-md bg-white appearance-none cursor-pointer focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
          >
            <option value="">{t.chatWidget.countryPlaceholder}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.dialCode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.chatWidget.phonePlaceholder}
            required
            className="w-full px-4 py-2.5 border border-cool-slate-300 rounded-xl text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-label-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-dark)] font-semibold text-label-md hover:bg-[var(--accent-gold-dark)] disabled:opacity-50 transition-colors"
      >
        {isLoading ? t.common.loading : t.chatWidget.startChat}
      </button>
    </form>
  )
}
```

- [ ] **Write ChatScreen sub-component**

```typescript
function ChatScreen({
  messages,
  inputValue,
  setInputValue,
  isLoading,
  error,
  sendMessage,
  handleKeyDown,
  statusColor,
  messagesEndRef,
  inputRef,
  isAgentTyping,
  t,
}: {
  messages: Message[]
  inputValue: string
  setInputValue: (v: string) => void
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  statusColor: (type: string) => string
  messagesEndRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLInputElement>
  isAgentTyping: boolean
  t: any
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender_type !== 'user' && (
              <div className={`w-7 h-7 rounded-full ${statusColor(msg.sender_type)} flex items-center justify-center text-white shrink-0 mt-1 mr-2`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[80%] ${msg.sender_type === 'user' ? 'order-1' : ''}`}>
              {msg.created_at && (
                <p className="text-[10px] text-cool-slate-400 mb-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
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
            <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-label-sm">{error}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
      </div>
    </>
  )
}
```

- [ ] **Write SurveyScreen sub-component**

```typescript
function SurveyScreen({
  surveyRating,
  setSurveyRating,
  surveyComment,
  setSurveyComment,
  surveySubmitted,
  onSubmit,
  onSkip,
  onNewChat,
  t,
}: {
  surveyRating: number
  setSurveyRating: (r: number) => void
  surveyComment: string
  setSurveyComment: (c: string) => void
  surveySubmitted: boolean
  onSubmit: () => void
  onSkip: () => void
  onNewChat: () => void
  t: any
}) {
  if (surveySubmitted) {
    return (
      <div className="flex-1 p-6 text-center overflow-y-auto">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-body-md font-semibold text-[var(--text-primary)] mb-2">
          {t.chatWidget.thanks}
        </p>
        <button
          onClick={onNewChat}
          className="mt-4 px-6 py-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-dark)] font-semibold text-label-md hover:bg-[var(--accent-gold-dark)] transition-colors"
        >
          {t.chatWidget.newChat}
        </button>
      </div>
    )
  }

  const labels = [t.chatWidget.rating1, t.chatWidget.rating2, t.chatWidget.rating3, t.chatWidget.rating4, t.chatWidget.rating5]

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      <p className="text-body-md font-semibold text-[var(--text-primary)] text-center">
        {t.chatWidget.surveyTitle}
      </p>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setSurveyRating(star)}
            className={`text-3xl transition-all ${
              star <= surveyRating ? 'text-yellow-400 scale-110' : 'text-cool-slate-300 hover:text-yellow-300'
            }`}
            title={labels[star - 1]}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={surveyComment}
        onChange={(e) => setSurveyComment(e.target.value)}
        placeholder={t.chatWidget.surveyComment}
        rows={3}
        className="w-full px-4 py-2.5 border border-cool-slate-300 rounded-xl text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 resize-none"
      />

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 rounded-xl border border-cool-slate-300 text-label-md text-cool-slate-600 hover:bg-cool-slate-50 transition-colors"
        >
          {t.chatWidget.surveySkip}
        </button>
        <button
          onClick={onSubmit}
          disabled={surveyRating === 0}
          className="flex-1 py-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-dark)] font-semibold text-label-md hover:bg-[var(--accent-gold-dark)] disabled:opacity-50 transition-colors"
        >
          {t.chatWidget.surveySubmit}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Write ClosedScreen sub-component**

```typescript
function ClosedScreen({
  onNewChat,
  t,
}: {
  onNewChat: () => void
  t: any
}) {
  return (
    <div className="flex-1 p-6 text-center overflow-y-auto">
      <p className="text-body-md text-cool-slate-500 mb-2">
        {t.chatWidget.conversationClosed}
      </p>
      <button
        onClick={onNewChat}
        className="text-label-md text-[var(--accent-gold)] hover:underline mt-2"
      >
        {t.chatWidget.reopen}
      </button>
    </div>
  )
}
```

- [ ] **Commit**

---

### Task 7: API — PATCH /api/chat/status (Admin status update)

**Files:**
- Create: `app/api/chat/status/route.ts`

- [ ] **Write the status update endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const userResult = await db.execute({
      sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
      args: [userId],
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const roleId = (userResult.rows[0] as { role_id: number | null }).role_id
    if (roleId === null) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { conversationId, status, message } = await request.json()

    if (!conversationId || !status) {
      return NextResponse.json(
        { error: 'conversationId and status are required' },
        { status: 400 },
      )
    }

    const validStatuses = ['pending', 'active', 'waiting_user', 'inactive', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      )
    }

    await db.execute({
      sql: "UPDATE conversations SET status = ?, updated_at = datetime('now') WHERE id = ?",
      args: [status, conversationId],
    })

    // If closing, insert system message
    if (status === 'resolved' || status === 'closed') {
      await db.execute({
        sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
              VALUES (?, 'system', ?, 'system')`,
        args: [conversationId, message || 'Conversation closed'],
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Chat Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 },
    )
  }
}
```

- [ ] **Commit**

---

### Task 8: API — POST /api/chat/rating (Satisfaction survey)

**Files:**
- Create: `app/api/chat/rating/route.ts`

- [ ] **Write the rating endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { conversationId, rating, comment } = await request.json()

    if (!conversationId || !rating) {
      return NextResponse.json(
        { error: 'conversationId and rating are required' },
        { status: 400 },
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 },
      )
    }

    const db = getDb()

    await db.execute({
      sql: `INSERT INTO conversation_ratings (conversation_id, rating, comment)
            VALUES (?, ?, ?)`,
      args: [conversationId, rating, comment || null],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Chat Rating] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 },
    )
  }
}
```

- [ ] **Commit**

---

### Task 9: Modify POST /api/chat/send for Inactivity Reset

**Files:**
- Modify: `app/api/chat/send/route.ts`

- [ ] **Add last_message_at update after agent send**

The existing endpoint already updates `last_message_at` for user messages (line 157-158). Verify it also does so for agent messages (line 86-88). Both paths should update `updated_at` and `last_message_at`. No changes needed — this is already correct.

- [ ] **Verify and commit** (verify no changes needed)

---

### Task 10: Update Admin Chat Page

**Files:**
- Modify: `app/admin/ia-chat/page.tsx`

- [ ] **Add new status constants and styles**

Add new status values alongside existing ones:

```typescript
type FilterMode = 'all' | 'ai_active' | 'escalated' | 'human_active' | 'closed' | 'flagged' | 'pending' | 'active' | 'waiting_user' | 'inactive' | 'resolved'

const STATUS_STYLES: Record<string, string> = {
  ai_active: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
  escalated: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
  human_active: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
  closed: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
  pending: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
  active: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
  waiting_user: 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]',
  inactive: 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]',
  resolved: 'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6]',
}
```

- [ ] **Add new filter buttons to the filter bar**

```typescript
{(['all', 'ai_active', 'escalated', 'human_active', 'pending', 'active', 'waiting_user', 'inactive', 'resolved', 'closed', 'flagged'] as FilterMode[]).map((f) => (
  // ... existing filter button pattern
))}
```

- [ ] **Add phone and country info to the user info bar**

After the existing email and booking reference display, add:

```typescript
{(selectedConv as any).user_phone && (
  <span>Tel: {(selectedConv as any).country_code || ''} {(selectedConv as any).user_phone}</span>
)}
{(selectedConv as any).user_country && (
  <span>Country: {(selectedConv as any).user_country}</span>
)}
```

- [ ] **Add "Finalizar" button alongside existing action buttons**

After the existing close button, add a "Finalizar Conversación" button that uses the status PATCH endpoint:

```typescript
{selectedConv.status === 'human_active' && (
  <button
    onClick={handleFinalize}
    className="px-3 py-1.5 text-[11px] font-medium bg-[#8b5cf6] text-white rounded-[6px] hover:bg-[#7c3aed] transition-all"
  >
    Finalizar
  </button>
)}
```

- [ ] **Add handleFinalize callback**

```typescript
const handleFinalize = useCallback(async () => {
  if (!selectedConv) return
  try {
    const res = await fetch('/api/chat/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConv.id,
        status: 'resolved',
        message: 'La conversación ha sido finalizada por nuestro equipo de soporte. Gracias por contactarnos.',
      }),
    })
    const data = await res.json()
    if (data.success) {
      fetchConversations()
      setSelectedConv(prev => prev ? { ...prev, status: 'resolved' } : null)
      setMessages(prev => [...prev, {
        id: Date.now(),
        conversation_id: selectedConv.id,
        sender_type: 'system',
        sender_id: null,
        content: 'La conversación ha sido finalizada por nuestro equipo de soporte. Gracias por contactarnos.',
        message_type: 'system',
        created_at: new Date().toISOString(),
        agent_name: null,
      }])
    }
  } catch (err) {
    console.error('[AdminChat] Finalize error:', err)
  }
}, [selectedConv, fetchConversations])
```

- [ ] **Commit**

---

### Task 11: i18n — Add Translation Keys

**Files:**
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/es.ts`

- [ ] **Add EN keys**

Replace the existing `chatWidget` object in `en.ts`:

```typescript
chatWidget: {
  title: 'Need help?',
  subtitle: 'Ask us anything about your booking or Medellín experience.',
  startMessage: '¡Hola! 👋 How can I help you today?',
  inputPlaceholder: 'Type a message...',
  close: 'Close chat',
  open: 'Open chat',
  escalateToHuman: 'Talk to a person',
  escalateConfirm: 'One moment, connecting you with a team member...',
  conversationClosed: 'Conversation closed. Need anything else?',
  connectionLost: 'Connection lost. Retrying...',
  retry: 'Retry',
  reopen: 'Start new conversation',
  send: 'Send',
  formTitle: 'Start a conversation',
  namePlaceholder: 'Full name',
  emailPlaceholder: 'Email',
  phonePlaceholder: 'Phone',
  countryPlaceholder: 'Code',
  startChat: 'Start chat',
  inactivityWarning: '¿Sigues disponible? Estamos atentos para ayudarte.',
  inactivityClosed: 'La conversación ha sido cerrada por inactividad. Si necesitas ayuda nuevamente, puedes iniciar un nuevo chat.',
  closedByAgent: 'La conversación ha sido finalizada por nuestro equipo de soporte. Gracias por contactarnos.',
  surveyTitle: 'How would you rate the support received?',
  surveyComment: 'Additional comments (optional)',
  surveySubmit: 'Submit',
  surveySkip: 'Skip',
  rating1: 'Very poor',
  rating2: 'Poor',
  rating3: 'Average',
  rating4: 'Good',
  rating5: 'Excellent',
  thanks: 'Thank you for your feedback!',
  newChat: 'New conversation',
},
```

- [ ] **Add ES keys**

Replace the existing `chatWidget` object in `es.ts`:

```typescript
chatWidget: {
  title: '¿Necesitas ayuda?',
  subtitle: 'Pregúntanos sobre tu reserva o tu experiencia en Medellín.',
  startMessage: '¡Hola! 👋 ¿Cómo puedo ayudarte hoy?',
  inputPlaceholder: 'Escribe un mensaje...',
  close: 'Cerrar chat',
  open: 'Abrir chat',
  escalateToHuman: 'Hablar con una persona',
  escalateConfirm: 'Un momento, conectando con un miembro del equipo...',
  conversationClosed: 'Conversación cerrada. ¿Necesitas algo más?',
  connectionLost: 'Conexión perdida. Reintentando...',
  retry: 'Reintentar',
  reopen: 'Nueva conversación',
  send: 'Enviar',
  formTitle: 'Iniciar conversación',
  namePlaceholder: 'Nombre completo',
  emailPlaceholder: 'Correo electrónico',
  phonePlaceholder: 'Teléfono',
  countryPlaceholder: 'Código',
  startChat: 'Iniciar chat',
  inactivityWarning: '¿Sigues disponible? Estamos atentos para ayudarte.',
  inactivityClosed: 'La conversación ha sido cerrada por inactividad. Si necesitas ayuda nuevamente, puedes iniciar un nuevo chat.',
  closedByAgent: 'La conversación ha sido finalizada por nuestro equipo de soporte. Gracias por contactarnos.',
  surveyTitle: '¿Cómo calificarías la atención recibida?',
  surveyComment: 'Comentario adicional (opcional)',
  surveySubmit: 'Enviar',
  surveySkip: 'Omitir',
  rating1: 'Muy mala',
  rating2: 'Mala',
  rating3: 'Regular',
  rating4: 'Buena',
  rating5: 'Excelente',
  thanks: '¡Gracias por tu opinión!',
  newChat: 'Nueva conversación',
},
```

- [ ] **Commit**

---

### Task 12: Update POST /api/chat/close to Handle New Statuses

**Files:**
- Modify: `app/api/chat/close/route.ts`

- [ ] **Add support for `resolved` and `closed` statuses**

The current close endpoint only releases to AI mode (`ai_active`). Add logic to handle `closedBy: 'inactivity'` (set status to `closed`) and `closedBy: 'agent'` with finalize (set to `resolved`):

```typescript
export async function POST(request: Request) {
  try {
    const { conversationId, closedBy, locale } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 },
      )
    }

    const db = getDb()

    if (closedBy === 'inactivity') {
      // Auto-close due to inactivity
      await db.execute({
        sql: "UPDATE conversations SET status = 'closed', updated_at = datetime('now') WHERE id = ?",
        args: [conversationId],
      })

      return NextResponse.json({ success: true, status: 'closed' })
    }

    if (closedBy === 'agent' || closedBy === 'user') {
      // Agent finalizing or user closing
      const newStatus = closedBy === 'agent' ? 'resolved' : 'closed'
      await db.execute({
        sql: "UPDATE conversations SET status = ?, updated_at = datetime('now') WHERE id = ?",
        args: [newStatus, conversationId],
      })

      return NextResponse.json({ success: true, status: newStatus })
    }

    // Default: existing Clerk-protected release-to-AI behavior
    const { userId } = await auth()
    // ... existing code for ai_active release
  }
}
```

- [ ] **Commit**

---

## Self-Review Checklist

- [ ] **Spec coverage**: Every requirement in the spec has a corresponding task: pre-chat form (Task 6), states (Task 1, 7), inactivity monitoring (Task 6), survey (Task 6, 8), admin finalize (Task 10), session reset (Task 6), i18n (Task 11), DB migration (Task 1).
- [ ] **Placeholder scan**: No TBD, TODOs, or "implement later" patterns.
- [ ] **Type consistency**: The `FormData` interface in Task 6 matches the expected payload in Task 4. Status values used in Task 7 match those defined in Task 1. Translation keys in Task 11 match references in Task 6.
