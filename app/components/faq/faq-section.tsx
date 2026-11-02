'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: '¿Con cuánta anticipación debo reservar mi traslado al aeropuerto?',
    answer: 'Recomendamos reservar con al menos 10 días de anticipación para garantizar disponibilidad del conductor y el vehículo que prefieras.',
  },
  {
    question: '¿Incluye el traslado de regreso al aeropuerto?',
    answer: 'El traslado de regreso es opcional. Puedes agregarlo al momento de la reserva con un cargo adicional.',
  },
  {
    question: '¿Qué pasa si mi vuelo se retrasa?',
    answer: 'Monitoreamos tu vuelo en tiempo real y ajustamos la hora de recogida automáticamente, sin costo adicional.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito y débito a través de nuestra plataforma de pagos segura (Polar).',
  },
  {
    question: '¿Puedo cancelar mi reserva?',
    answer: 'Sí, ofrecemos cancelación gratuita hasta 48 horas antes de tu llegada. Después de ese plazo, aplica un cargo.',
  },
  {
    question: '¿Los conductores hablan inglés?',
    answer: 'Sí, todos nuestros conductores son bilingües (español e inglés) y tienen experiencia en turismo premium.',
  },
]

export default function FAQSection() {
  const { t } = useI18n()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section id="faq" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            Preguntas frecuentes
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-medium tracking-tight text-white mb-4 text-balance">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            Todo lo que necesitas saber antes de reservar tu experiencia en Medellín.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
          {faqItems.map((item, i) => {
            const isOpen = openId === item.question
            return (
              <div key={i} className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 transition-all hover:bg-[var(--bg-dark)]/50 cursor-pointer">
                <button
                  onClick={() => setOpenId(openId === item.question ? null : item.question)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.question}</h3>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-light)] pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
