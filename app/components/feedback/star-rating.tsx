'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

const ratingLabels = [
  '',
  'feedback.ratingLabels.1',
  'feedback.ratingLabels.2',
  'feedback.ratingLabels.3',
  'feedback.ratingLabels.4',
  'feedback.ratingLabels.5',
] as const;

export default function StarRating({ value, onChange }: StarRatingProps) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex gap-2 sm:gap-3"
        role="radiogroup"
        aria-label={t.feedback.starRatingAriaLabel}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] scale-110 shadow-[0_0_16px_rgba(212,165,116,0.25)]'
                  : 'bg-[var(--surface)] border-2 border-[var(--border)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5'
                }`}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(star)}
            >
              <span className={`transition-all duration-200 ${isActive ? 'grayscale-0' : 'grayscale opacity-40'}`}>
                ⭐
              </span>
            </button>
          );
        })}
      </div>

      {/* Rating label */}
      <div className="h-6 flex items-center">
        {(hovered || value) > 0 && (
          <span className="text-[var(--accent-gold)] text-sm font-medium animate-[fadeIn_0.15s_ease]">
            {t.feedback.ratingLabels[String(hovered || value) as keyof typeof t.feedback.ratingLabels]}
          </span>
        )}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between w-full max-w-xs text-[10px] sm:text-xs text-[var(--text-muted)] px-1">
        <span>1 — {t.feedback.scaleLabels.bad}</span>
        <span>5 — {t.feedback.scaleLabels.excellent}</span>
      </div>
    </div>
  );
}
