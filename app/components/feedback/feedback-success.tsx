'use client';

import { useI18n } from '@/lib/i18n';

export default function FeedbackSuccess() {
  const { t } = useI18n();

  return (
    <div className="text-center py-8 animate-[fadeInUp_0.5s_ease]">
      {/* Success icon */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--accent-gold)]/15 flex items-center justify-center mx-auto mb-6 animate-[fadeInUp_0.6s_ease]">
        <span className="text-4xl sm:text-5xl">❤️</span>
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
        {t.feedback.success.title}
      </h2>

      <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-md mx-auto mb-3 leading-relaxed">
        {t.feedback.success.message}
      </p>

      <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-sm mx-auto mb-8">
        {t.feedback.success.subMessage}
      </p>

      {/* CTA */}
      <a
        href="/"
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gold-gradient text-[var(--bg-dark)] font-semibold text-sm sm:text-[15px] shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
      >
        {t.feedback.success.backToHome}
      </a>
    </div>
  );
}
