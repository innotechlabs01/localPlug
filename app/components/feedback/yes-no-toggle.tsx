'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface YesNoToggleProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  problemDescription: string;
  onProblemChange: (value: string) => void;
}

export default function YesNoToggle({
  value,
  onChange,
  problemDescription,
  onProblemChange,
}: YesNoToggleProps) {
  const { t } = useI18n();
  const [showProblem, setShowProblem] = useState(false);

  const handleSelect = (selected: boolean) => {
    onChange(selected);
    setShowProblem(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          className={`flex-1 text-center px-4 py-3.5 rounded-xl text-sm sm:text-[15px] font-medium transition-all duration-200 cursor-pointer min-h-[48px]
            ${value === false
              ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,165,116,0.15)]'
              : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5 hover:text-[var(--text-primary)]'
            }`}
          onClick={() => handleSelect(false)}
        >
          {t.feedback.hadProblem.no}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          className={`flex-1 text-center px-4 py-3.5 rounded-xl text-sm sm:text-[15px] font-medium transition-all duration-200 cursor-pointer min-h-[48px]
            ${value === true
              ? 'bg-[var(--accent-gold)]/15 border-2 border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-[0_0_12px_rgba(212,165,116,0.15)]'
              : 'bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 hover:bg-[var(--accent-gold)]/5 hover:text-[var(--text-primary)]'
            }`}
          onClick={() => handleSelect(true)}
        >
          {t.feedback.hadProblem.yes}
        </button>
      </div>

      {/* Conditional textarea */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          value === true ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-1">
          <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
            {t.feedback.hadProblem.tellUs}
          </label>
          <textarea
            value={problemDescription}
            onChange={(e) => onProblemChange(e.target.value)}
            placeholder={t.feedback.hadProblem.placeholder}
            rows={3}
            className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 resize-none transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}
