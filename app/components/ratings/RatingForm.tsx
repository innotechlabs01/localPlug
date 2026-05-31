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
