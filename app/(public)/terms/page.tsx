import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service | Medellín Premium',
}

export default function TermsPage() {
  return <LegalPage titleKey="termsTitle" lastUpdatedKey="lastUpdated" pageKey="terms" />
}
