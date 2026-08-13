'use client';

import { useI18n } from '@/lib/i18n';

interface FeedbackHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export default function FeedbackHeader({ currentStep, totalSteps }: FeedbackHeaderProps) {
  const { t } = useI18n();
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="text-center mb-8 sm:mb-10">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-sm)] bg-gold-gradient flex items-center justify-center">
          <span className="text-white font-bold text-sm sm:text-base">L</span>
        </div>
        <span className="font-display text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
          LocalPlug
        </span>
      </div>

      {/* Title */}
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 leading-tight">
        {t.feedback.title}
      </h1>

      {/* Description */}
      <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-md mx-auto mb-2">
        {t.feedback.description}
      </p>
      <p className="text-[var(--text-muted)] text-xs sm:text-sm">
        {t.feedback.timeEstimate}
      </p>

      {/* Meta indicator */}
      <div className="flex items-center justify-center gap-2 mt-3 mb-6">
        <span className="text-[var(--text-muted)] text-xs">
          {t.feedback.metaInfo}
        </span>
      </div>

      {/* Progress */}
      <div className="max-w-xs mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[var(--text-muted)] text-xs font-medium">
            {t.feedback.progressLabel.replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}
          </span>
          <span className="text-[var(--accent-gold)] text-xs font-semibold">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-gradient rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
}
