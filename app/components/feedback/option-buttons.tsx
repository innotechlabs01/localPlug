'use client';

import { useI18n } from '@/lib/i18n';

interface OptionButtonsProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ key: string; label: string }>;
}

export default function OptionButtons({ value, onChange, options }: OptionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-2.5">
      {options.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl text-sm sm:text-[15px] font-medium transition-all duration-200 cursor-pointer min-h-[48px]
              ${isSelected
                ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,165,116,0.15)]'
                : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5 hover:text-[var(--text-primary)]'
              }`}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function InlineOptionButtons({ value, onChange, options }: OptionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`flex-1 text-center px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-[15px] font-medium transition-all duration-200 cursor-pointer min-h-[48px]
              ${isSelected
                ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,165,116,0.15)]'
                : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5 hover:text-[var(--text-primary)]'
              }`}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
