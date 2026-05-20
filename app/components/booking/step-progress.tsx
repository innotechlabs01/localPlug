'use client'

import { useI18n } from '@/lib/i18n'

interface StepProgressProps {
  currentStep: number
  totalSteps: number
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const { t } = useI18n()
  const percent = Math.round(((currentStep + 1) / totalSteps) * 100)

  const stepLabels = [
    t.stepProgress.labels.flight,
    t.stepProgress.labels.profile,
    t.stepProgress.labels.destination,
    t.stepProgress.labels.packages,
  ]

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        {stepLabels.map((label, i) => (
          <div
            key={label}
            className="flex flex-col items-center"
            aria-current={i === currentStep ? 'step' : undefined}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-label-sm font-bold transition-all duration-300 ${
                i <= currentStep
                  ? 'bg-[var(--accent-gold)] text-[var(--bg-dark)]'
                  : 'bg-[var(--surface)] text-[var(--text-muted)]'
              }`}
            >
              {i < currentStep ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-label-sm mt-1.5 hidden sm:block ${
              i <= currentStep ? 'text-white font-semibold' : 'text-[var(--text-muted)]'
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full bg-[var(--surface)] rounded-full h-2"
      >
        <div
          className="bg-[var(--accent-gold)] h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-label-sm text-[var(--text-muted)] mt-2 text-right">{t.stepProgress.complete.replace('{percent}', String(percent))}</p>
    </div>
  )
}
