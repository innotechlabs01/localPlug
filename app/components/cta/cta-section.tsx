'use client'

import Link from 'next/link'
import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'

function CtaInner() {
  const { t } = useI18n()
  return (
    <section className="py-[140px] text-center relative overflow-hidden bg-gradient-to-b from-[var(--bg-dark)] via-[#0f1a16] to-[#0a120e]">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(212,165,116,0.15) 0%, transparent 50%)',
      }} />
      <div className="relative z-[1] mx-auto max-w-container px-4 md:px-12">
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
