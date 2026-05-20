'use client'

import Image from 'next/image'
import HeroCta from './hero-cta'
import { useI18n } from '@/lib/i18n'

function HeroInner() {
  const { t } = useI18n()
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-[var(--bg-dark)] to-[#0d1512]">
      <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-split.jpg"
            alt={t.hero.altBackground}
            fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,10,10,0.7)] via-[rgba(10,10,10,0.4)] to-[rgba(10,10,10,0.9)]" />
      </div>
      <div className="absolute inset-0 z-[1]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(212,165,116,0.12) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute w-[600px] h-[600px] -top-[200px] -right-[100px] z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-container px-4 md:px-12 py-32 lg:py-40 w-full">
        <div className="max-w-[720px]">
          <div className="inline-flex items-center gap-2.5 bg-[var(--surface-glass)] backdrop-blur-md border border-[var(--border-light)] rounded-full px-5 py-2.5 text-sm font-medium text-[var(--accent-gold-light)] mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-slow" />
            <span>{t.hero.badge}</span>
          </div>
          <h1 className="font-display text-[clamp(42px,6.5vw,72px)] font-semibold leading-[1.08] tracking-tight text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            {t.hero.title}{' '}
            <em className="not-italic bg-gradient-to-r from-[var(--accent-gold-light)] via-[var(--accent-gold)] to-[var(--accent-gold-dark)] bg-clip-text text-transparent">
              {t.hero.emphasis}
            </em>
          </h1>
          <p className="text-[clamp(17px,2vw,20px)] leading-relaxed text-[var(--text-secondary)] max-w-[580px] mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            {t.hero.subtitle}
          </p>
          <HeroCta />
          <div className="flex gap-7 mt-14 pt-7 border-t border-[var(--border)] animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center text-[var(--accent-gold)] text-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <strong className="block text-sm font-semibold">{t.hero.trustDriver}</strong>
                <span className="text-xs text-[var(--text-muted)]">{t.hero.trustDriverDesc}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center text-[var(--accent-gold)] text-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <strong className="block text-sm font-semibold">{t.hero.trustRating}</strong>
                <span className="text-xs text-[var(--text-muted)]">{t.hero.trustRatingDesc}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center text-[var(--accent-gold)] text-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <div>
                <strong className="block text-sm font-semibold">{t.hero.trustSupport}</strong>
                <span className="text-xs text-[var(--text-muted)]">{t.hero.trustSupportDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 z-5 max-w-[480px] hidden lg:block">
        <div className="rounded-[var(--radius-xl)] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative">
          <Image
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80"
            alt={t.hero.altCard}
            width={480}
            height={380}
            className="object-cover h-[380px]"
          />
          <div className="absolute bottom-0 left-0 right-0 p-7 bg-gradient-to-t from-[rgba(0,0,0,0.85)] to-transparent">
            <h4 className="text-[22px] font-semibold mb-1">{t.hero.cardTitle}</h4>
            <p className="text-sm text-[var(--text-secondary)]">{t.hero.cardDesc}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HeroSection() {
  return <HeroInner />
}
