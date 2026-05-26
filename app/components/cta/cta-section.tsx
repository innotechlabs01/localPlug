'use client'

import Link from 'next/link'
import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

function CtaInner() {
  const { t } = useI18n()
  const { ref, isVisible } = useScrollReveal()

  return (
    <section className="py-[140px] text-center relative overflow-hidden bg-gradient-to-b from-[var(--bg-dark)] via-[#0f1a16] to-[#0a120e]">
      {/* Ambient glow */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(212,165,116,0.15) 0%, transparent 50%)',
      }} />

      {/* Floating orbs */}
      <div className="absolute top-20 left-[15%] w-64 h-64 rounded-full bg-[rgba(212,165,116,0.08)] blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-20 right-[15%] w-48 h-48 rounded-full bg-[rgba(212,165,116,0.06)] blur-3xl pointer-events-none" aria-hidden="true" />

      <div ref={ref} className={`relative z-[1] mx-auto max-w-container px-4 md:px-12 reveal ${isVisible ? 'visible' : ''}`}>
        <h2 className="font-display text-[clamp(36px,5vw,56px)] font-semibold tracking-tight text-white mb-5">
          {t.cta.title}
        </h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-[500px] mx-auto mb-10">
          {t.cta.subtitle}
        </p>
        <Link href="/booking">
          <Button variant="primary" size="lg">
            {t.cta.button}
          </Button>
        </Link>
      </div>
    </section>
  )
}

export default function CtaSection() {
  return <CtaInner />
}
