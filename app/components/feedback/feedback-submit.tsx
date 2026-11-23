'use client';

import { useI18n } from '@/lib/i18n';

interface FeedbackSubmitProps {
  isSubmitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

export default function FeedbackSubmit({ isSubmitting, disabled, onSubmit }: FeedbackSubmitProps) {
  const { t } = useI18n();

  return (
    <div className="pt-4">
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className={`w-full py-4 px-8 rounded-xl text-base sm:text-lg font-bold transition-all duration-200 min-h-[56px]
          ${isSubmitting || disabled
            ? 'bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
            : 'bg-gold-gradient text-[var(--bg-dark)] shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.feedback.submitting}
          </span>
        ) : (
          t.feedback.submitCta
        )}
      </button>
    </div>
  );
}
