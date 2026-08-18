import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Refund & Cancelation Policy | Medellín Premium',
}

export default function RefundPolicyPage() {
  return (
    <LegalPage titleKey="refundTitle" lastUpdatedKey="lastUpdated">
      <section>
        <h2>1. Free Cancelation</h2>
        <p>
          You may cancel your booking free of charge up to 72 hours before the scheduled service.
          In this case, you will receive a full refund to your original payment method within 5–10
          business days. To cancel, contact our support team via WhatsApp or email with your
          booking reference number.
        </p>
      </section>

      <section>
        <h2>2. Late Cancelation (Within 48 Hours)</h2>
        <p>
          Cancelations made between 48 and 24 hours before the scheduled service are subject to a
          50% cancellation fee. The remaining 50% will be refunded to your original payment method
          within 5–10 business days. Cancelations made less than 24 hours before the scheduled
          service are not eligible for a refund unless covered by another section of this policy.
        </p>
      </section>

      <section>
        <h2>3. No-Show</h2>
        <p>
          If you fail to appear for your scheduled service without prior notice, no refund will be
          issued. This applies to transportation, guided experiences, and all other booked services.
          We strongly recommend arriving at least 15 minutes before your scheduled pickup or meeting
          time and contacting us immediately if you anticipate a delay.
        </p>
      </section>

      <section>
        <h2>4. Flight Changes or Delays</h2>
        <p>
          If your flight is significantly delayed or changed by the airline, and this prevents you
          from using a booked service, we will work with you to reschedule or provide a full refund
          for the affected service. Please notify us as soon as you become aware of any flight
          changes and provide documentation such as airline confirmation of the delay or
          cancellation.
        </p>
      </section>

      <section>
        <h2>5. Service Not Rendered</h2>
        <p>
          If Medellín Premium or one of our partners is unable to deliver a booked service for
          reasons within our control, you will receive a full refund for the unavailable service.
          This includes situations such as provider cancellations, vehicle breakdowns, or safety
          concerns that prevent service delivery. We will make every effort to offer a suitable
          alternative before issuing a refund.
        </p>
      </section>

      <section>
        <h2>6. Partial Services</h2>
        <p>
          If a service is partially delivered due to circumstances within our control, you may be
          entitled to a partial refund proportional to the portion of the service not rendered. For
          example, if a guided tour is cut short by 50%, you would receive a 50% refund for that
          service. Requests for partial refunds must be submitted within 48 hours of the affected
          service date.
        </p>
      </section>

      <section>
        <h2>7. How Refunds Are Processed</h2>
        <p>
          All refunds are processed to the original payment method used at the time of booking.
          Refunds typically appear within 5–10 business days, depending on your bank or card
          issuer. You will receive a confirmation notification once your refund has been processed.
          If you have not received your refund after 10 business days, please contact our support
          team with your booking reference number for assistance.
        </p>
      </section>

      <section>
        <h2>8. Disputes</h2>
        <p>
          If you believe a refund decision was made in error or you have a dispute regarding a
          cancellation, please contact our support team within 14 days of the service date. We will
          review your case and respond within 5 business days. If the dispute cannot be resolved
          directly, either party may pursue resolution through the applicable dispute mechanisms
          outlined in our Terms of Service.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          For any questions about this Refund &amp; Cancelation Policy or to request a refund,
          please contact us through our official communication channels. Our support team is
          available to assist you and will respond to refund requests as quickly as possible.
        </p>
      </section>
    </LegalPage>
  )
}
