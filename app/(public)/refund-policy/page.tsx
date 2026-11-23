import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Medellín Premium',
}

export default function RefundPolicyPage() {
  return <LegalPage titleKey="refundTitle" lastUpdatedKey="lastUpdated" pageKey="refund" />
}
