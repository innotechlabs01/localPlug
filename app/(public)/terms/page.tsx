import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service | Medellín Premium',
}

export default function TermsPage() {
  return (
    <LegalPage titleKey="termsTitle" lastUpdatedKey="lastUpdated">
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Medellín Premium platform and services, you agree to be bound
          by these Terms of Service. If you do not agree with any part of these terms, you must not
          use our services. These terms constitute a legally binding agreement between you and
          Medellín Premium.
        </p>
      </section>

      <section>
        <h2>2. Services</h2>
        <p>
          Medellín Premium provides a premium travel and experience booking platform for visitors
          to Medellín, Colombia. Our services include transportation arrangements, accommodation
          coordination, curated experiences, and concierge support. All services are subject to
          availability and may be modified or discontinued at our discretion.
        </p>
      </section>

      <section>
        <h2>3. Booking &amp; Payment</h2>
        <p>
          All bookings are subject to confirmation and availability. Prices are displayed in the
          applicable currency and include applicable taxes unless otherwise stated. Payment must be
          completed in full at the time of booking. We accept major credit cards and other payment
          methods as indicated during the checkout process. A booking is only confirmed once you
          receive a confirmation notification from Medellín Premium.
        </p>
      </section>

      <section>
        <h2>4. Cancellation &amp; Refund Policy</h2>
        <p>
          Cancellation policies vary by service and are communicated at the time of booking.
          Generally, cancellations made within 24 hours of the scheduled service may be eligible for
          a full refund. Cancellations made between 24 and 72 hours prior may receive a partial
          refund. Cancellations made less than 24 hours before the scheduled service are not
          eligible for a refund. Refunds are processed to the original payment method within 5–10
          business days.
        </p>
      </section>

      <section>
        <h2>5. User Responsibilities</h2>
        <p>
          You are responsible for providing accurate and complete information during the booking
          process. You must comply with all applicable local laws and regulations while using our
          services in Medellín. You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your account. You agree not to
          misuse our services or attempt to access them using unauthorized methods.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          Medellín Premium acts as an intermediary between users and service providers. We are not
          liable for any injury, loss, damage, or expense arising from the use of third-party
          services. Our total liability shall not exceed the amount paid for the specific booking in
          question. We are not responsible for delays, cancellations, or changes caused by force
          majeure events, including but not limited to natural disasters, strikes, or government
          actions.
        </p>
      </section>

      <section>
        <h2>7. Communications</h2>
        <p>
          By using our services, you consent to receive communications from Medellín Premium,
          including booking confirmations, service updates, and promotional materials. You may opt
          out of promotional communications at any time by following the unsubscribe instructions
          provided in our messages. Transactional communications related to your bookings will
          continue regardless of your marketing preferences.
        </p>
      </section>

      <section>
        <h2>8. Governing Law</h2>
        <p>
          These Terms of Service are governed by and construed in accordance with the laws of
          Colombia. Any disputes arising from these terms or the use of our services shall be subject
          to the exclusive jurisdiction of the courts of Medellín, Colombia. Both parties agree to
          attempt to resolve any dispute through good-faith negotiation before pursuing formal legal
          action.
        </p>
      </section>

      <section>
        <h2>9. Changes to Terms</h2>
        <p>
          Medellín Premium reserves the right to modify these Terms of Service at any time. Changes
          will be effective immediately upon posting on this page. Your continued use of our
          services after any changes constitutes acceptance of the updated terms. We encourage you
          to review these terms periodically for any updates.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us through our
          official communication channels. Our support team is available to assist you with any
          inquiries regarding these terms or our services.
        </p>
      </section>
    </LegalPage>
  )
}
