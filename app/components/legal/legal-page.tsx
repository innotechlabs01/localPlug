'use client'

import { type ReactNode } from 'react'
import Header from '@/app/components/layout/header'
import Footer from '@/app/components/layout/footer'
import { useI18n } from '@/lib/i18n'

interface LegalPageProps {
  titleKey: string
  lastUpdatedKey: string
  children: ReactNode
}

export default function LegalPage({ titleKey, lastUpdatedKey, children }: LegalPageProps) {
  const { t } = useI18n()

  const title = t.legal[titleKey as keyof typeof t.legal] || titleKey
  const lastUpdated = t.legal[lastUpdatedKey as keyof typeof t.legal] || lastUpdatedKey

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <Header />
      <main className="bg-[var(--bg-dark)] pt-24 pb-20">
        <div className="mx-auto max-w-container px-4 md:px-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
              {title}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-10">
              {lastUpdated}
            </p>

            <div className="prose-legal text-[var(--text-secondary)] leading-relaxed space-y-6">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
