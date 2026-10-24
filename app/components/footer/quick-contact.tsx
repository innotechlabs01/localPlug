'use client'

import { useState } from 'react'

export default function QuickContact() {
  const [sent, setSent] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setSent('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        setSent('success')
        ;(e.currentTarget as HTMLFormElement).reset()
      } else {
        setSent('error')
      }
    } catch {
      setSent('error')
    }
  }

  if (sent === 'success') {
    return (
      <section className="py-8 bg-[var(--bg-card)] border-t border-[var(--border)]">
        <div className="mx-auto max-w-[600px] px-4 text-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            ¡Gracias por contactarnos!
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Te responderemos a la brevedad por WhatsApp o email.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-[var(--bg-card)] border-t border-[var(--border)]">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[600px] px-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Nombre</label>
          <input
            name="name"
            type="text"
            placeholder="Tu nombre"
            required
            className="w-full px-3 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/20 transition-all"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Email</label>
          <input
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            className="w-full px-3 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/20 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={sent === 'sending'}
          className="px-6 py-2.5 bg-[var(--accent-gold)] text-[var(--bg-dark)] font-semibold rounded-md hover:bg-[var(--accent-gold-light)] disabled:opacity-60 transition-colors"
        >
          {sent === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </section>
  )
}
