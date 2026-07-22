'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'
import type { Paddle } from '@paddle/paddle-js'

interface Plan {
  id: number
  slug: string
  name: string
  description: string
  price_usd: number
  is_popular: number
  features: string[]
  tours?: {
    id: number
    name: string
    description: string
    price_per_person_usd: number
  }[]
}

export default function PricingSection() {
  const { t } = useI18n()
  const [plans, setPlans] = useState<Plan[]>([])
  const [trmRate, setTrmRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const paddleRef = useRef<Paddle | null>(null)
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 })

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, trmRes] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/trm'),
        ])

        const plansData = await plansRes.json()
        const trmData = await trmRes.json()

        setPlans(plansData.plans || [])
        setTrmRate(trmData.rate || null)
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (
      paddleRef.current ||
      !process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ||
      !process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      return
    }

    import('@paddle/paddle-js').then(({ initializePaddle }) =>
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production',
      }).then((p) => {
        if (p) paddleRef.current = p
      }),
    )
  }, [])

  const handleCheckout = useCallback(
    async (plan: Plan) => {
      if (!paddleRef.current) {
        window.location.href = `/booking?plan=${plan.slug}`
        return
      }

      setCheckoutLoading(plan.slug)
      try {
        const bookingReference = crypto.randomUUID()
        const res = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: plan.slug,
            customerEmail: '',
            customerName: '',
            bookingReference,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create checkout')
        }

        const { transactionId } = await res.json()

        paddleRef.current.Checkout.open({
          transactionId,
          settings: {
            displayMode: 'overlay',
            successUrl: `${window.location.origin}/booking/confirmation?ref=${bookingReference}`,
          },
        })
      } catch (err) {
        console.error('Checkout error:', err)
        window.location.href = `/booking?plan=${plan.slug}`
      } finally {
        setCheckoutLoading(null)
      }
    },
    [],
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price)
  }

  const formatCOP = (usd: number) => {
    if (!trmRate) return null
    const cop = usd * trmRate
    return new Intl.NumberFormat('es-CO').format(Math.round(cop))
  }

  return (
    <section id="pricing" className="py-[120px]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.pricing.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.pricing.subtitle}
          </p>
          {trmRate && (
            <p className="text-sm text-[var(--text-muted)] mt-3">
              1 USD = {formatCOP(1)} COP
            </p>
          )}
        </div>

        {loading ? (
          <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto stagger-children ${gridVisible ? 'visible' : ''}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-10 animate-pulse">
                <div className="h-6 bg-[var(--border)] rounded w-1/2 mb-4" />
                <div className="h-10 bg-[var(--border)] rounded w-1/3 mb-4" />
                <div className="h-4 bg-[var(--border)] rounded w-3/4 mb-7" />
                <div className="space-y-3 mb-8">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-[var(--border)] rounded w-full" />
                  ))}
                </div>
                <div className="h-12 bg-[var(--border)] rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto stagger-children ${gridVisible ? 'visible' : ''}`}>
            {plans.map((plan) => {
              const isPopular = plan.is_popular === 1
              return (
                <article
                  key={plan.id}
                  className={`relative bg-[var(--bg-card)] border rounded-[var(--radius-xl)] p-10 transition-all duration-300 hover:-translate-y-1 ${
                    isPopular
                      ? 'border-[var(--accent-gold)] bg-gradient-to-b from-[rgba(212,165,116,0.08)] to-[var(--bg-card)] shadow-[0_0_60px_rgba(212,165,116,0.15)] hover:shadow-[0_0_80px_rgba(212,165,116,0.2)]'
                      : 'border-[var(--border)] hover:border-[var(--accent-gold)] hover:shadow-[0_12px_40px_rgba(212,165,116,0.1)]'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-[var(--bg-dark)] px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[.05em] shadow-[0_2px_8px_rgba(212,165,116,0.3)]">
                      {t.pricing.popular}
                    </span>
                  )}

                  <h3 className="text-[22px] font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="text-[42px] font-bold text-[var(--accent-gold)] mb-2">
                    ${formatPrice(plan.price_usd)}
                    <span className="text-[15px] text-[var(--text-muted)] font-normal"> {t.pricing.starting}</span>
                  </div>
                  {trmRate && (
                    <p className="text-sm text-[var(--text-muted)] mb-2">
                      ~${formatCOP(plan.price_usd)} COP
                    </p>
                  )}
                  <p className="text-sm text-[var(--text-muted)] mb-7">{plan.description}</p>

                  <ul className="space-y-1 mb-8" role="list">
                    {(plan.features || []).map((f: string) => (
                      <li key={f} className="flex items-center gap-3 py-2.5 text-sm text-[var(--text-secondary)] border-b border-[var(--border)]">
                        <span className="w-5 h-5 rounded-full bg-[rgba(212,165,116,0.2)] text-[var(--accent-gold)] flex items-center justify-center text-[11px] shrink-0" aria-hidden="true">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.tours && plan.tours.length > 0 && (
                    <div className="mb-8">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] mb-3">
                        {t.pricing.tours || 'Available Tours'}
                      </p>
                      <ul className="space-y-2">
                        {plan.tours.map((tour) => (
                          <li key={tour.id} className="flex justify-between items-center text-sm text-[var(--text-secondary)]">
                            <span>{tour.name}</span>
                            <span className="text-[var(--accent-gold)] font-medium">
                              +${formatPrice(tour.price_per_person_usd)}/person
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {paddleRef.current ? (
                    <Button
                      variant={isPopular ? 'primary' : 'secondary'}
                      className="w-full"
                      disabled={checkoutLoading === plan.slug}
                      onClick={() => handleCheckout(plan)}
                    >
                      {checkoutLoading === plan.slug ? 'Processing...' : t.pricing.selectPlan}
                    </Button>
                  ) : (
                    <Link href={`/booking?plan=${plan.slug}`} className="block">
                      <Button variant={isPopular ? 'primary' : 'secondary'} className="w-full">
                        {t.pricing.selectPlan}
                      </Button>
                    </Link>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
