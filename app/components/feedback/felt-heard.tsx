'use client';

import { useI18n } from '@/lib/i18n';

interface FeltHeardProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FeltHeard({ value, onChange }: FeltHeardProps) {
  const { t } = useI18n();

  const options = [
    { key: 'completely', emoji: '❤️', label: t.feedback.feltHeard.completely },
    { key: 'yes', emoji: '🙂', label: t.feedback.feltHeard.yes },
    { key: 'somewhat', emoji: '😐', label: t.feedback.feltHeard.somewhat },
    { key: 'no', emoji: '😕', label: t.feedback.feltHeard.no },
    { key: 'not_at_all', emoji: '❌', label: t.feedback.feltHeard.notAtAll },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
      {options.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer min-h-[48px]
              ${isSelected
                ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,165,116,0.15)]'
                : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5 hover:text-[var(--text-primary)]'
              }`}
            onClick={() => onChange(opt.key)}
          >
            <span className="text-base sm:text-lg leading-none">{opt.emoji}</span>
            <span className="leading-tight text-center">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
