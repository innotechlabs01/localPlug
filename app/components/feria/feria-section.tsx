'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

export default function FeriaSection() {
  const { t } = useI18n()
  const feria = t.feria
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 })

  return (
    <section id="feria" className="relative py-0 overflow-hidden">
      {/* Full-width background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/experiences-7.jpg"
          alt="Feria de las Flores — Medellín"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,10,0.92)] via-[rgba(10,10,10,0.75)] to-[rgba(10,10,10,0.6)]" />
      </div>

      <div ref={ref} className={`relative z-10 mx-auto max-w-container px-4 md:px-12 py-20 md:py-28 reveal ${isVisible ? 'visible' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — content */}
          <div>
            <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[#ff6b6b] mb-5">
              <span className="w-7 h-[2px] bg-[#ff6b6b] rounded" aria-hidden="true" />
              {feria.tag}
            </div>
            <h2 className="font-display text-[clamp(32px,4.5vw,52px)] font-semibold tracking-tight text-white mb-4 leading-tight">
              {feria.title}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed max-w-[520px]">
              {feria.description}
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {feria.highlights.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(255,107,107,0.15)] flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/90">{h}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/booking"
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white font-semibold px-7 py-3.5 rounded-[var(--radius-md)] hover:opacity-90 transition-all shadow-[0_4px_24px_rgba(233,69,96,0.35)]"
            >
              {feria.cta}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right — image grid */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative rounded-[var(--radius-xl)] overflow-hidden aspect-[3/4]">
                  <Image
                    src="/images/experiences-7.jpg"
                    alt="Silletero con silleta de flores"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="relative rounded-[var(--radius-xl)] overflow-hidden aspect-square">
                  <Image
                    src="/images/experiences-8.jpg"
                    alt="Flores tropicales de Colombia"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative rounded-[var(--radius-xl)] overflow-hidden aspect-square">
                  <Image
                    src="/images/experiences-15.jpg"
                    alt="Desfile de Silleteros"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="relative rounded-[var(--radius-xl)] overflow-hidden aspect-[3/4]">
                  <Image
                    src="/images/experiences-12.jpg"
                    alt="Medellín durante la Feria"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
