'use client'

import Image from 'next/image'
import HeroCta from './hero-cta'
import { useI18n } from '@/lib/i18n'

const FERIA_DATES = 'Aug 1 – 10, 2026'
const FERIA_COUNTDOWN_DAYS = 18

function FeriaBanner() {
  return (
    <div className="relative z-20 bg-gradient-to-r from-[#e94560] via-[#ff6b6b] to-[#e94560] py-2.5 px-4 text-center">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/>
          </svg>
          {FERIA_COUNTDOWN_DAYS} days away
        </span>
        <span className="text-white/80">|</span>
        <span className="text-sm font-semibold text-white">
          🌸 Feria de las Flores {FERIA_DATES}
        </span>
        <span className="text-white/80">|</span>
        <a href="#feria" className="text-xs font-bold uppercase tracking-wider text-white underline underline-offset-2 hover:text-white/80 transition-colors">
          Book Now →
        </a>
      </div>
    </div>
  )
}

function TrustIndicator({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-[rgba(212,165,116,0.12)] flex items-center justify-center text-[var(--accent-gold)] shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <strong className="block text-sm font-semibold text-white">{title}</strong>
        <span className="text-xs text-[var(--text-muted)] leading-tight">{description}</span>
      </div>
    </div>
  )
}

function HeroInner() {
  const { t } = useI18n()
  return (
    <>
      <FeriaBanner />
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-[var(--bg-dark)] to-[#0d1512]">
      {/* Background image — Medellín skyline at sunset */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1727719917899-0167d90709d1?w=1920&q=80&auto=format&fit=crop"
          alt={t.hero.altBackground}
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,10,10,0.7)] via-[rgba(10,10,10,0.4)] to-[rgba(10,10,10,0.9)]" />
      </div>

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 z-[1]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(212,165,116,0.12) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Ambient glow */}
      <div className="absolute w-[600px] h-[600px] -top-[200px] -right-[100px] z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-container px-4 md:px-12 py-32 lg:py-40 w-full">
        <div className="max-w-[720px]">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[var(--surface-glass)] backdrop-blur-md border border-[var(--border-light)] rounded-full px-5 py-2.5 text-sm font-medium text-[var(--accent-gold-light)] mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-slow" aria-hidden="true" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-[clamp(42px,6.5vw,72px)] font-semibold leading-[1.08] tracking-tight text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            {t.hero.title}{' '}
            <em className="not-italic bg-gradient-to-r from-[var(--accent-gold-light)] via-[var(--accent-gold)] to-[var(--accent-gold-dark)] bg-clip-text text-transparent">
              {t.hero.emphasis}
            </em>
          </h1>

          {/* Subtitle */}
          <p className="text-[clamp(17px,2vw,20px)] leading-relaxed text-[var(--text-secondary)] max-w-[580px] mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            {t.hero.subtitle}
          </p>

          {/* CTA buttons */}
          <HeroCta />

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-x-8 gap-y-5 mt-14 pt-7 border-t border-[var(--border)] animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <TrustIndicator
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              title={t.hero.trustDriver}
              description={t.hero.trustDriverDesc}
            />
            <TrustIndicator
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
              title={t.hero.trustRating}
              description={t.hero.trustRatingDesc}
            />
            <TrustIndicator
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
              title={t.hero.trustSupport}
              description={t.hero.trustSupportDesc}
            />
          </div>
        </div>
      </div>

      {/* Floating card - desktop only */}
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 z-5 max-w-[480px] hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <div className="rounded-[var(--radius-xl)] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&q=80&auto=format&fit=crop"
            alt={t.hero.altCard}
            width={480}
            height={380}
            className="object-cover h-[380px]"
          />
          <div className="absolute bottom-0 left-0 right-0 p-7 bg-gradient-to-t from-[rgba(0,0,0,0.85)] to-transparent">
            <h4 className="text-[22px] font-semibold mb-1 text-white">{t.hero.cardTitle}</h4>
            <p className="text-sm text-[var(--text-secondary)]">{t.hero.cardDesc}</p>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}

export default function HeroSection() {
  return <HeroInner />
}
