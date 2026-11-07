'use client';

import { useI18n } from '@/lib/i18n';

interface EmojiChoiceProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EmojiChoice({ value, onChange }: EmojiChoiceProps) {
  const { t } = useI18n();

  const options = [
    { key: 'very_difficult', emoji: '😞', label: t.feedback.bookingEase.veryDifficult },
    { key: 'difficult', emoji: '😕', label: t.feedback.bookingEase.difficult },
    { key: 'neutral', emoji: '😐', label: t.feedback.bookingEase.neutral },
    { key: 'easy', emoji: '🙂', label: t.feedback.bookingEase.easy },
    { key: 'very_easy', emoji: '😍', label: t.feedback.bookingEase.veryEasy },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer min-h-[72px] sm:min-h-[88px]
              ${isSelected
                ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,165,116,0.2)]'
                : 'bg-[var(--surface)] border-2 border-[var(--border)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5'
              }`}
            onClick={() => onChange(opt.key)}
          >
            <span className="text-2xl sm:text-3xl leading-none">{opt.emoji}</span>
            <span className={`text-[10px] sm:text-xs font-medium leading-tight text-center ${isSelected ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
