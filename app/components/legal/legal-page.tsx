'use client'

import Header from '@/app/components/layout/header'
import Footer from '@/app/components/layout/footer'
import { useI18n } from '@/lib/i18n'

type LegalTranslationKey = 'termsTitle' | 'privacyTitle' | 'refundTitle' | 'lastUpdated' | 'effectiveDate'
type LegalPageKey = 'terms' | 'privacy' | 'refund'

interface LegalSection {
  heading: string
  body: string
}

interface LegalPageProps {
  titleKey: LegalTranslationKey
  lastUpdatedKey: LegalTranslationKey
  pageKey: LegalPageKey
}

export default function LegalPage({ titleKey, lastUpdatedKey, pageKey }: LegalPageProps) {
  const { t } = useI18n()

  const title = t.legal[titleKey] || titleKey
  const lastUpdated = t.legal[lastUpdatedKey] || lastUpdatedKey
  const sections: LegalSection[] = (t.legal.content as Record<string, LegalSection[]>)?.[pageKey] || []

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

            <div className="text-[var(--text-secondary)] text-[15px] leading-relaxed space-y-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
              {sections.map((section, i) => (
                <section key={i}>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
