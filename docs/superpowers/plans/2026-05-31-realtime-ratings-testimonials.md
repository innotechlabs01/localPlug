# Real-Time Ratings & Testimonials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time ratings system that collects customer feedback after chat conversations close and displays live testimonials on the Home page with auto-advancing carousel and aggregate stats.

**Architecture:** Turso/libSQL database with a new `ratings` table. API routes for CRUD + stats. ChatWidget modified to show rating form on close. Home page testimonials section replaced with Embla Carousel fed by polling API. Comment auto-moderation via word filter.

**Tech Stack:** Next.js 15, React 18, TypeScript, Turso (libSQL), Embla Carousel, Tailwind CSS

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `lib/db/migrations/020_ratings_table.sql` | Ratings table + indexes |
| `lib/db/migrations/021_conversation_response_time.sql` | Add first_agent_response_at to conversations |
| `lib/moderation/comment-filter.ts` | Auto-filter profanity/spam/URLs |
| `lib/services/rating-service.ts` | Rating CRUD + stats queries |
| `app/api/ratings/route.ts` | GET (latest 10) + POST (submit rating) |
| `app/api/ratings/stats/route.ts` | GET aggregate stats |
| `app/components/ratings/RatingForm.tsx` | Star selector + name/country/comment form |
| `app/components/ratings/RatingCard.tsx` | Single testimonial card |
| `app/components/ratings/RatingStats.tsx` | 4-metric stats bar |
| `app/components/ratings/RatingsProvider.tsx` | React context + polling |
| `app/components/ratings/TestimonialsSlider.tsx` | Embla carousel wrapper |

### Modified Files
| File | Change |
|------|--------|
| `app/components/chat/ChatWidget.tsx` | Detect closed status, show RatingForm |
| `app/components/testimonials/testimonials-section.tsx` | Replace hardcoded with dynamic carousel |
| `app/api/chat/send/route.ts` | Track first_agent_response_at |
| `lib/i18n/locales/en.ts` | Add ratings.* strings |
| `lib/i18n/locales/es.ts` | Add ratings.* strings |

### Dependencies
| Package | Purpose |
|---------|---------|
| `embla-carousel-react` | Touch-friendly carousel |

---

## Task 1: Database Migrations

**Files:**
- Create: `lib/db/migrations/020_ratings_table.sql`
- Create: `lib/db/migrations/021_conversation_response_time.sql`

- [ ] **Step 1: Create ratings table migration**

```sql
-- lib/db/migrations/020_ratings_table.sql
-- Migration: Create ratings table for customer testimonials
-- Created: 2026-05-31

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL UNIQUE,
  customer_name VARCHAR(150) NOT NULL,
  customer_country VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  resolved INTEGER DEFAULT 1,
  first_response_time_ms INTEGER DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX idx_ratings_rating ON ratings(rating);
CREATE INDEX idx_ratings_conversation_id ON ratings(conversation_id);
```

- [ ] **Step 2: Create response time tracking migration**

```sql
-- lib/db/migrations/021_conversation_response_time.sql
-- Migration: Add first_agent_response_at to conversations for response time tracking
-- Created: 2026-05-31

ALTER TABLE conversations ADD COLUMN first_agent_response_at TEXT DEFAULT NULL;
```

- [ ] **Step 3: Run migrations**

Run: `npx tsx scripts/migrate.ts`
Expected: Both migrations apply successfully (or skip if already applied)

- [ ] **Step 4: Commit**

```bash
git add lib/db/migrations/020_ratings_table.sql lib/db/migrations/021_conversation_response_time.sql
git commit -m "feat(db): add ratings table and conversation response time tracking"
```

---

## Task 2: Comment Moderation Filter

**Files:**
- Create: `lib/moderation/comment-filter.ts`

- [ ] **Step 1: Create comment filter utility**

```typescript
// lib/moderation/comment-filter.ts

const PROFANITY_LIST_EN = [
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'dick', 'hell', 'stupid',
  'idiot', 'moron', 'loser', 'suck', 'hate', 'ugly',
]

const PROFANITY_LIST_ES = [
  'mierda', 'puta', 'pendejo', 'pendeja', 'imbecil', 'estupido', 'estupida',
  'idiota', 'basura', 'asco', 'carajo', 'joder', 'maldito', 'maldita',
  'gilipollas', 'capullo', 'cabron', 'cabrona', 'pelotudo', 'pelotuda',
]

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i
const SPAM_REPEAT_REGEX = /(.)\1{5,}/
const SPAM_CAPS_BLOCK_REGEX = /[A-Z\s]{20,}/

export interface ModerationResult {
  isClean: boolean
  filteredComment: string
}

export function filterComment(comment: string): ModerationResult {
  if (!comment || !comment.trim()) {
    return { isClean: true, filteredComment: '' }
  }

  const lower = comment.toLowerCase()

  // Check for URLs
  if (URL_REGEX.test(comment)) {
    return { isClean: false, filteredComment: '' }
  }

  // Check for spam patterns
  if (SPAM_REPEAT_REGEX.test(comment)) {
    return { isClean: false, filteredComment: '' }
  }
  if (SPAM_CAPS_BLOCK_REGEX.test(comment)) {
    return { isClean: false, filteredComment: '' }
  }

  // Check profanity
  const hasProfanity = PROFANITY_LIST_EN.some(w => lower.includes(w)) ||
    PROFANITY_LIST_ES.some(w => lower.includes(w))

  if (hasProfanity) {
    return { isClean: false, filteredComment: '' }
  }

  return { isClean: true, filteredComment: comment.trim() }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/moderation/comment-filter.ts
git commit -m "feat: add auto-moderation comment filter for ratings"
```

---

## Task 3: Rating Service Layer

**Files:**
- Create: `lib/services/rating-service.ts`

- [ ] **Step 1: Create rating service**

```typescript
// lib/services/rating-service.ts
import { getDb } from '@/lib/db'

export interface Rating {
  id: number
  conversation_id: number
  customer_name: string
  customer_country: string
  rating: number
  comment: string
  resolved: number
  first_response_time_ms: number | null
  created_at: string
  updated_at: string
}

export interface RatingStats {
  avg_rating: number
  total_ratings: number
  resolved_pct: number
  avg_response_time_ms: number | null
}

export async function createRating(data: {
  conversation_id: number
  customer_name: string
  customer_country: string
  rating: number
  comment: string
  resolved?: number
  first_response_time_ms?: number | null
}): Promise<Rating> {
  const db = getDb()

  const result = await db.execute({
    sql: `INSERT INTO ratings (conversation_id, customer_name, customer_country, rating, comment, resolved, first_response_time_ms)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.conversation_id,
      data.customer_name,
      data.customer_country,
      data.rating,
      data.comment || '',
      data.resolved ?? 1,
      data.first_response_time_ms ?? null,
    ],
  })

  const inserted = await db.execute({
    sql: 'SELECT * FROM ratings WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  })

  return inserted.rows[0] as unknown as Rating
}

export async function getLatestRatings(limit: number = 10): Promise<Rating[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, conversation_id, customer_name, customer_country, rating, comment, resolved, created_at
          FROM ratings
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [limit],
  })
  return result.rows as unknown as Rating[]
}

export async function getRatingStats(): Promise<RatingStats> {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT
            COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating,
            COUNT(*) AS total_ratings,
            COALESCE(ROUND(CAST(SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100), 0) AS resolved_pct,
            COALESCE(ROUND(AVG(first_response_time_ms)), NULL) AS avg_response_time_ms
          FROM ratings`,
    args: [],
  })

  const row = result.rows[0]
  return {
    avg_rating: Number(row?.avg_rating || 0),
    total_ratings: Number(row?.total_ratings || 0),
    resolved_pct: Number(row?.resolved_pct || 0),
    avg_response_time_ms: row?.avg_response_time_ms != null ? Number(row.avg_response_time_ms) : null,
  }
}

export async function ratingExistsForConversation(conversationId: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM ratings WHERE conversation_id = ?',
    args: [conversationId],
  })
  return Number(result.rows[0]?.cnt || 0) > 0
}

export async function getFirstResponseTimeMs(conversationId: number): Promise<number | null> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT (julianday(first_agent_response_at) - julianday(created_at)) * 86400000 AS ms
          FROM conversations
          WHERE id = ? AND first_agent_response_at IS NOT NULL`,
    args: [conversationId],
  })
  if (result.rows.length === 0) return null
  const ms = Number(result.rows[0].ms)
  return isNaN(ms) ? null : Math.round(ms)
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/services/rating-service.ts
git commit -m "feat: add rating service layer with CRUD and stats"
```

---

## Task 4: API Routes — Ratings

**Files:**
- Create: `app/api/ratings/route.ts`
- Create: `app/api/ratings/stats/route.ts`

- [ ] **Step 1: Create POST /api/ratings and GET /api/ratings**

```typescript
// app/api/ratings/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { createRating, getLatestRatings, ratingExistsForConversation, getFirstResponseTimeMs } from '@/lib/services/rating-service'
import { filterComment } from '@/lib/moderation/comment-filter'

export async function GET() {
  try {
    const ratings = await getLatestRatings(10)
    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('[Ratings API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversation_id, customer_name, customer_country, rating, comment } = body

    if (!conversation_id || !customer_name || !customer_country || !rating) {
      return NextResponse.json(
        { error: 'conversation_id, customer_name, customer_country, and rating are required' },
        { status: 400 }
      )
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    if (customer_name.length > 150) {
      return NextResponse.json(
        { error: 'customer_name must be 150 characters or less' },
        { status: 400 }
      )
    }

    if (customer_country.length > 100) {
      return NextResponse.json(
        { error: 'customer_country must be 100 characters or less' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Verify conversation exists and is closed
    const convResult = await db.execute({
      sql: 'SELECT id, status FROM conversations WHERE id = ?',
      args: [conversation_id],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check for duplicate rating
    const existing = await ratingExistsForConversation(conversation_id)
    if (existing) {
      return NextResponse.json(
        { error: 'A rating already exists for this conversation' },
        { status: 409 }
      )
    }

    // Filter comment
    const moderation = filterComment(comment || '')

    // Get first response time
    const responseTimeMs = await getFirstResponseTimeMs(conversation_id)

    const ratingRecord = await createRating({
      conversation_id,
      customer_name: customer_name.trim(),
      customer_country: customer_country.trim(),
      rating,
      comment: moderation.filteredComment,
      resolved: 1,
      first_response_time_ms: responseTimeMs,
    })

    return NextResponse.json({ success: true, rating: ratingRecord }, { status: 201 })
  } catch (error) {
    console.error('[Ratings API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create GET /api/ratings/stats**

```typescript
// app/api/ratings/stats/route.ts
import { NextResponse } from 'next/server'
import { getRatingStats } from '@/lib/services/rating-service'

// Simple in-memory cache
let statsCache: { data: Awaited<ReturnType<typeof getRatingStats>>; timestamp: number } | null = null
const CACHE_TTL_MS = 30_000

export async function GET() {
  try {
    const now = Date.now()
    if (statsCache && now - statsCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(statsCache.data)
    }

    const stats = await getRatingStats()
    statsCache = { data: stats, timestamp: now }
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Ratings Stats API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/ratings/route.ts app/api/ratings/stats/route.ts
git commit -m "feat(api): add ratings CRUD and stats endpoints"
```

---

## Task 5: Track First Agent Response Time

**Files:**
- Modify: `app/api/chat/send/route.ts`

- [ ] **Step 1: Add first_agent_response_at tracking to agent message path**

In `app/api/chat/send/route.ts`, after the agent inserts a message (around line 88, after the `UPDATE conversations SET last_message_at` block), add tracking of first agent response:

Find this block (lines 86-89):
```typescript
      await db.execute({
        sql: 'UPDATE conversations SET last_message_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?',
        args: [convId],
      })
```

Replace with:
```typescript
      await db.execute({
        sql: 'UPDATE conversations SET last_message_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?',
        args: [convId],
      })

      // Track first agent response time for rating stats
      await db.execute({
        sql: `UPDATE conversations SET first_agent_response_at = datetime('now')
              WHERE id = ? AND first_agent_response_at IS NULL`,
        args: [convId],
      })
```

- [ ] **Step 2: Add first_agent_response_at tracking to AI fallback response path**

Find this block (lines 186-190, the AI fallback response):
```typescript
    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'ai', ?, 'text')`,
      args: [convId, fallbackContent],
    })
```

Replace with:
```typescript
    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'ai', ?, 'text')`,
      args: [convId, fallbackContent],
    })

    // Track first AI response time for rating stats
    await db.execute({
      sql: `UPDATE conversations SET first_agent_response_at = datetime('now')
            WHERE id = ? AND first_agent_response_at IS NULL`,
      args: [convId],
    })
```

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/send/route.ts
git commit -m "feat(chat): track first agent/AI response time for rating stats"
```

---

## Task 6: Rating Form Component

**Files:**
- Create: `app/components/ratings/RatingForm.tsx`

- [ ] **Step 1: Create RatingForm component**

```tsx
// app/components/ratings/RatingForm.tsx
'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

interface RatingFormProps {
  conversationId: number
  onSubmitted: () => void
}

export default function RatingForm({ conversationId, onSubmitted }: RatingFormProps) {
  const { t } = useI18n()
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !name.trim() || !country.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          customer_name: name.trim(),
          customer_country: country.trim(),
          rating,
          comment: comment.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit rating')
      }

      setSubmitted(true)
      localStorage.setItem(`rated_${conversationId}`, 'true')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-4xl mb-3">⭐</div>
        <p className="text-body-lg font-semibold text-[var(--text-primary)] mb-1">
          {t.ratings.form.thanks}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <p className="text-label-md font-semibold text-[var(--text-primary)]">
        {t.ratings.title}
      </p>

      {/* Star selector */}
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill={(hoveredStar || rating) >= star ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-colors ${
                (hoveredStar || rating) >= star ? 'text-yellow-400' : 'text-cool-slate-300'
              }`}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>

      {/* Name input */}
      <div>
        <label className="block text-label-sm text-cool-slate-500 mb-1">{t.ratings.form.name}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          required
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
        />
      </div>

      {/* Country input */}
      <div>
        <label className="block text-label-sm text-cool-slate-500 mb-1">{t.ratings.form.country}</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          maxLength={100}
          required
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
        />
      </div>

      {/* Comment textarea */}
      <div>
        <label className="block text-label-sm text-cool-slate-500 mb-1">{t.ratings.form.comment}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-cool-slate-300 rounded-lg text-body-md text-[var(--text-primary)] bg-white placeholder:text-cool-slate-400 focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 resize-none"
        />
      </div>

      {error && (
        <p className="text-label-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || !name.trim() || !country.trim() || isSubmitting}
        className="w-full py-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-dark)] font-semibold text-body-md hover:bg-[var(--accent-gold-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? t.common.processing : t.ratings.form.submit}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ratings/RatingForm.tsx
git commit -m "feat(ui): add RatingForm component with star selector"
```

---

## Task 7: Integrate RatingForm into ChatWidget

**Files:**
- Modify: `app/components/chat/ChatWidget.tsx`

- [ ] **Step 1: Add imports and state for rating**

At the top of `ChatWidget.tsx`, add the import after line 4 (`import { useI18n } from '@/lib/i18n'`):

```typescript
import RatingForm from '@/app/components/ratings/RatingForm'
```

After line 32 (`const [isClosed, setIsClosed] = useState(false)`), add:

```typescript
const [showRating, setShowRating] = useState(false)
const [hasRated, setHasRated] = useState(false)
```

- [ ] **Step 2: Detect closed status and check if already rated**

After the `useEffect` that persists conversationId (after line 59), add a new useEffect:

```typescript
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
```

- [ ] **Step 3: Replace the closed state UI with rating form**

Find the `isClosed` block (lines 367-377):
```typescript
            ) : (
              <div className="border-t border-cool-slate-200 p-4 text-center shrink-0">
                <p className="text-body-md text-cool-slate-500 mb-2">{t.chatWidget.conversationClosed}</p>
                <button
                  onClick={() => { setIsClosed(false); setConversationId(null); setMessages([]) }}
                  className="text-label-md text-[var(--accent-gold)] hover:underline"
                >
                  {t.chatWidget.reopen}
                </button>
              </div>
            )}
```

Replace with:
```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add app/components/chat/ChatWidget.tsx
git commit -m "feat(chat): integrate RatingForm into ChatWidget on conversation close"
```

---

## Task 8: i18n Strings

**Files:**
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/es.ts`

- [ ] **Step 1: Add ratings strings to English locale**

In `lib/i18n/locales/en.ts`, add the `ratings` section after the `chat` section (after line 1344, before `resetPassword`):

```typescript
  ratings: {
    title: 'What our customers say',
    form: {
      name: 'Your name',
      country: 'Your country',
      comment: 'Comment (optional)',
      submit: 'Submit rating',
      thanks: 'Thank you for your feedback!',
    },
    stats: {
      avg: 'Average rating',
      total: 'Total reviews',
      resolved: 'Cases resolved',
      response: 'Avg response time',
    },
  },
```

- [ ] **Step 2: Add ratings strings to Spanish locale**

In `lib/i18n/locales/es.ts`, add the `ratings` section after the `chat` section (find the closing `}` of the `chat` object):

```typescript
  ratings: {
    title: 'Lo que opinan nuestros clientes',
    form: {
      name: 'Tu nombre',
      country: 'Tu país',
      comment: 'Comentario (opcional)',
      submit: 'Enviar calificación',
      thanks: '¡Gracias por tu opinión!',
    },
    stats: {
      avg: 'Calificación promedio',
      total: 'Total de valoraciones',
      resolved: 'Casos resueltos',
      response: 'Tiempo promedio de respuesta',
    },
  },
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/locales/en.ts lib/i18n/locales/es.ts
git commit -m "feat(i18n): add ratings strings in EN and ES"
```

---

## Task 9: Install Embla Carousel

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install embla-carousel-react**

Run: `pnpm add embla-carousel-react`
Expected: Package installed successfully

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add embla-carousel-react"
```

---

## Task 10: RatingsProvider + RatingStats Components

**Files:**
- Create: `app/components/ratings/RatingsProvider.tsx`
- Create: `app/components/ratings/RatingStats.tsx`

- [ ] **Step 1: Create RatingsProvider**

```tsx
// app/components/ratings/RatingsProvider.tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface Rating {
  id: number
  customer_name: string
  customer_country: string
  rating: number
  comment: string
  created_at: string
}

interface RatingStats {
  avg_rating: number
  total_ratings: number
  resolved_pct: number
  avg_response_time_ms: number | null
}

interface RatingsContextValue {
  ratings: Rating[]
  stats: RatingStats
  isLoading: boolean
}

const RatingsContext = createContext<RatingsContextValue>({
  ratings: [],
  stats: { avg_rating: 0, total_ratings: 0, resolved_pct: 0, avg_response_time_ms: null },
  isLoading: true,
})

export function useRatings() {
  return useContext(RatingsContext)
}

function formatResponseTime(ms: number | null): string {
  if (ms == null) return '--'
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`
  return `${Math.round(ms / 3_600_000)}h`
}

export { formatResponseTime }

export default function RatingsProvider({ children }: { children: ReactNode }) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats>({
    avg_rating: 0,
    total_ratings: 0,
    resolved_pct: 0,
    avg_response_time_ms: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchRatings = useCallback(async () => {
    try {
      const res = await fetch('/api/ratings')
      const data = await res.json()
      if (data.ratings) setRatings(data.ratings)
    } catch {
      // silent
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/ratings/stats')
      const data = await res.json()
      if (data.avg_rating !== undefined) setStats(data)
    } catch {
      // silent
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchRatings(), fetchStats()])
    setIsLoading(false)
  }, [fetchRatings, fetchStats])

  useEffect(() => {
    fetchAll()

    const ratingsInterval = setInterval(fetchRatings, 15_000)
    const statsInterval = setInterval(fetchStats, 30_000)

    // Pause polling when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(ratingsInterval)
        clearInterval(statsInterval)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(ratingsInterval)
      clearInterval(statsInterval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchAll, fetchRatings, fetchStats])

  return (
    <RatingsContext.Provider value={{ ratings, stats, isLoading }}>
      {children}
    </RatingsContext.Provider>
  )
}
```

- [ ] **Step 2: Create RatingStats component**

```tsx
// app/components/ratings/RatingStats.tsx
'use client'

import { useI18n } from '@/lib/i18n'
import { useRatings, formatResponseTime } from './RatingsProvider'

export default function RatingStats() {
  const { t } = useI18n()
  const { stats } = useRatings()

  return (
    <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12">
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '--'} / 5
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          ⭐ {t.ratings.stats.avg}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {stats.total_ratings > 0 ? stats.total_ratings.toLocaleString() : '--'}
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          👥 {t.ratings.stats.total}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {stats.resolved_pct > 0 ? `${stats.resolved_pct}%` : '--'}
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          ✅ {t.ratings.stats.resolved}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {formatResponseTime(stats.avg_response_time_ms)}
        </div>
        <div className="text-label-sm text-[var(--text-secondary)] mt-1">
          ⚡ {t.ratings.stats.response}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/ratings/RatingsProvider.tsx app/components/ratings/RatingStats.tsx
git commit -m "feat(ui): add RatingsProvider context and RatingStats component"
```

---

## Task 11: RatingCard + TestimonialsSlider

**Files:**
- Create: `app/components/ratings/RatingCard.tsx`
- Create: `app/components/ratings/TestimonialsSlider.tsx`

- [ ] **Step 1: Create RatingCard**

```tsx
// app/components/ratings/RatingCard.tsx
'use client'

interface RatingCardProps {
  name: string
  country: string
  rating: number
  comment: string
  createdAt: string
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={i < rating ? 'text-yellow-400' : 'text-cool-slate-300'}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export default function RatingCard({ name, country, rating, comment, createdAt }: RatingCardProps) {
  const date = new Date(createdAt)
  const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <article className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-gold)] hover:shadow-[0_12px_40px_rgba(212,165,116,0.1)] h-full flex flex-col">
      <StarDisplay rating={rating} />
      {comment && (
        <blockquote className="mt-4 flex-1">
          <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed italic">
            &ldquo;{comment}&rdquo;
          </p>
        </blockquote>
      )}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-label-md font-semibold text-white">{name} - {country}</p>
        <p className="text-label-sm text-cool-slate-500 mt-0.5">{formattedDate}</p>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Create TestimonialsSlider**

```tsx
// app/components/ratings/TestimonialsSlider.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useRatings } from './RatingsProvider'
import RatingCard from './RatingCard'

export default function TestimonialsSlider() {
  const { ratings } = useRatings()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: ratings.length > 2,
    slidesToScroll: 1,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => emblaApi.off('select', onSelect)
  }, [emblaApi, onSelect])

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!emblaApi || isPaused || ratings.length <= 1) return
    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
      } else {
        emblaApi.scrollTo(0)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [emblaApi, isPaused, ratings.length])

  if (ratings.length === 0) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {ratings.map((r) => (
            <div key={r.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] min-w-0">
              <RatingCard
                name={r.customer_name}
                country={r.customer_country}
                rating={r.rating}
                comment={r.comment}
                createdAt={r.created_at}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {ratings.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev && !emblaApi?.scrollSnapList().length}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 shadow-lg"
            aria-label="Previous testimonial"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext && !emblaApi?.scrollSnapList().length}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 shadow-lg"
            aria-label="Next testimonial"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {ratings.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {ratings.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-[var(--accent-gold)]' : 'bg-cool-slate-500'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/ratings/RatingCard.tsx app/components/ratings/TestimonialsSlider.tsx
git commit -m "feat(ui): add RatingCard and TestimonialsSlider with Embla carousel"
```

---

## Task 12: Replace TestimonialsSection

**Files:**
- Modify: `app/components/testimonials/testimonials-section.tsx`

- [ ] **Step 1: Rewrite TestimonialsSection to use dynamic data**

Replace the entire content of `app/components/testimonials/testimonials-section.tsx` with:

```tsx
// app/components/testimonials/testimonials-section.tsx
'use client'

import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'
import RatingsProvider from '@/app/components/ratings/RatingsProvider'
import RatingStats from '@/app/components/ratings/RatingStats'
import TestimonialsSlider from '@/app/components/ratings/TestimonialsSlider'

function TestimonialsInner() {
  const { t } = useI18n()
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()

  return (
    <section id="testimonials" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.testimonials.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.ratings.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.testimonials.subtitle}
          </p>
        </div>

        <RatingStats />
        <TestimonialsSlider />
      </div>
    </section>
  )
}

export default function TestimonialsSection() {
  return (
    <RatingsProvider>
      <TestimonialsInner />
    </RatingsProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/testimonials/testimonials-section.tsx
git commit -m "feat(home): replace hardcoded testimonials with dynamic ratings carousel"
```

---

## Task 13: Type Check and Verify

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript type check**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run build to verify no runtime errors**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Run linter**

Run: `pnpm lint`
Expected: No errors (warnings acceptable)

- [ ] **Step 4: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: resolve type/lint issues from ratings feature"
```

Only run if there are actual fixes needed.

---

## Verification Checklist

After all tasks complete, verify:

1. **Database:** Migrations applied, `ratings` table exists with correct schema
2. **API:** `POST /api/ratings` creates rating, `GET /api/ratings` returns latest 10, `GET /api/ratings/stats` returns aggregates
3. **Chat:** Closing a conversation shows rating form, submitting stores rating, localStorage prevents re-showing
4. **Home:** Testimonials section shows dynamic data from DB, carousel auto-advances, stats show real metrics
5. **Moderation:** Profanity/URLs in comments are auto-filtered
6. **i18n:** All strings work in both EN and ES
7. **Performance:** Polling intervals are 15s (ratings) and 30s (stats), pauses on hidden tab
