import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Medellín Premium',
}

export default function PrivacyPage() {
  return <LegalPage titleKey="privacyTitle" lastUpdatedKey="lastUpdated" pageKey="privacy" />
}
