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
