'use client';

import { useI18n } from '@/lib/i18n';

interface NpsScaleProps {
  value: number;
  onChange: (value: number) => void;
}

export default function NpsScale({ value, onChange }: NpsScaleProps) {
  const { t } = useI18n();

  const getColor = (num: number) => {
    if (num <= 3) return 'bg-[var(--danger)]/20 border-[var(--danger)]/40 text-[var(--danger)]';
    if (num <= 6) return 'bg-[var(--warning)]/20 border-[var(--warning)]/40 text-[var(--warning)]';
    if (num <= 8) return 'bg-[var(--info)]/20 border-[var(--info)]/40 text-[var(--info)]';
    return 'bg-[var(--accent-gold)]/20 border-[var(--accent-gold)]/40 text-[var(--accent-gold)]';
  };

  const getSelectedColor = (num: number) => {
    if (num <= 3) return 'bg-[var(--danger)] border-[var(--danger)] text-white shadow-[0_0_16px_rgba(248,113,113,0.3)]';
    if (num <= 6) return 'bg-[var(--warning)] border-[var(--warning)] text-[var(--bg-dark)] shadow-[0_0_16px_rgba(250,204,21,0.3)]';
    if (num <= 8) return 'bg-[var(--info)] border-[var(--info)] text-white shadow-[0_0_16px_rgba(59,130,246,0.3)]';
    return 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--bg-dark)] shadow-[0_0_16px_rgba(212,165,116,0.3)]';
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid grid-cols-11 gap-1 sm:gap-1.5"
        role="radiogroup"
        aria-label={t.feedback.npsAriaLabel}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${num}`}
              className={`aspect-square rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center border-2
                ${isSelected
                  ? getSelectedColor(num)
                  : `${getColor(num)} hover:scale-110`
                }`}
              onClick={() => onChange(num)}
            >
              {num}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] sm:text-xs text-[var(--text-muted)] px-0.5">
        <span>{t.feedback.npsLabels.low}</span>
        <span>{t.feedback.npsLabels.high}</span>
      </div>
    </div>
  );
}
