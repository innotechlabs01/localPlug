import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Medellín Premium',
}

export default function PrivacyPage() {
  return (
    <LegalPage titleKey="privacyTitle" lastUpdatedKey="lastUpdated">
      <section>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, including your name, email address,
          phone number, travel dates, and booking preferences. We also collect payment information
          necessary to process your bookings, such as credit card details and billing addresses.
          Additionally, we may automatically collect certain information about your device and usage
          patterns when you interact with our platform, including IP address, browser type, and
          pages visited.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to process and manage your bookings, communicate with
          you about your reservations and upcoming trips, provide customer support, and improve our
          services. Your information also helps us personalize your experience, send promotional
          communications (with your consent), and comply with legal obligations. We do not sell
          your personal information to third parties.
        </p>
      </section>

      <section>
        <h2>3. WhatsApp Communications</h2>
        <p>
          Medellín Premium uses WhatsApp as a primary communication channel for booking
          confirmations, trip updates, and customer support. By providing your phone number, you
          consent to receive WhatsApp messages related to your bookings and services. These
          communications may include booking details, driver information, travel itineraries, and
          responses to your inquiries. Message frequency varies based on your activity. Standard
          messaging rates may apply according to your mobile carrier plan.
        </p>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>
          We share your information only as necessary to fulfill your bookings. This includes
          sharing relevant details with transportation providers, accommodation partners, and
          experience operators to confirm and deliver your reserved services. We may also share
          information with trusted third-party service providers who assist in operating our
          platform, such as payment processors and hosting providers, all under strict
          confidentiality agreements. We may disclose information when required by law or to
          protect our legal rights.
        </p>
      </section>

      <section>
        <h2>5. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your personal information,
          including encryption of data in transit and at rest, secure server infrastructure, and
          access controls. While we strive to use commercially acceptable means to protect your
          data, no method of transmission over the Internet or electronic storage is 100% secure.
          We continuously review and update our security practices to maintain the integrity of
          your information.
        </p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services,
          fulfill bookings, and comply with legal obligations. Booking records are maintained for
          a minimum period as required by Colombian tax and business regulations. When your data
          is no longer needed, we securely delete or anonymize it. You may request deletion of
          your data at any time, subject to our legal retention requirements.
        </p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal information at any time.
          You may also object to or restrict certain processing of your data, request portability
          of your information, and withdraw consent for marketing communications. To exercise any
          of these rights, please contact us through our official communication channels. We will
          respond to your request within a reasonable timeframe in accordance with applicable data
          protection laws.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Our platform uses cookies and similar technologies to enhance your browsing experience,
          analyze usage patterns, and personalize content. Cookies are small data files stored on
          your device that help us remember your preferences and understand how you interact with
          our site. You can control cookie settings through your browser preferences. Disabling
          certain cookies may affect the functionality of our platform, but core booking features
          will remain accessible.
        </p>
      </section>

      <section>
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices,
          technology, legal requirements, or other factors. When we make material changes, we will
          notify you through our platform or via email. Your continued use of our services after
          any updates constitutes acceptance of the revised policy. We encourage you to review
          this page periodically for the latest information on our privacy practices.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our
          data practices, please contact us through our official communication channels. Our
          support team is available to assist you with any privacy-related inquiries and will
          respond promptly to your concerns.
        </p>
      </section>
    </LegalPage>
  )
}
