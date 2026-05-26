'use client'

import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'
import { useEffect, useRef, useState } from 'react'

function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 })
  const [displayValue, setDisplayValue] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    hasAnimated.current = true

    const duration = 2000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(eased * value))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, value])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString()
    }
    return String(num)
  }

  return (
    <div ref={ref} className="px-4 py-2">
      <div className="font-display text-[clamp(36px,5vw,52px)] font-semibold bg-gradient-to-br from-[var(--accent-gold-light)] to-[var(--accent-gold)] bg-clip-text text-transparent leading-none mb-2">
        {formatNumber(displayValue)}{suffix}
      </div>
      <div className="text-sm text-[var(--text-secondary)]">
        {label}
      </div>
    </div>
  )
}

export default function StatsBar() {
  const { t } = useI18n()
  const { ref, isVisible } = useScrollReveal()

  const stats = [
    { value: 2400, suffix: '+', label: t.stats.travelers },
    { value: 98, suffix: '.7%', label: t.stats.onTime },
    { value: 50, suffix: '+', label: t.stats.experiences },
    { value: 24, suffix: '/7', label: t.stats.support },
  ]

  return (
    <section ref={ref} className={`py-16 bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)] ${isVisible ? 'visible' : ''}`}>
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {stats.map((s) => (
            <AnimatedStat
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
