import type { Metadata } from 'next'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'
import ChatWidget from '@/app/components/chat/ChatWidget'
import './globals.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Medellín Premium Experience | Luxury Tourism Platform',
    template: '%s | Medellín Premium',
  },
  description:
    'Premium airport transfers, personalized concierge, and unforgettable experiences across the most vibrant city in Colombia.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Medellín Premium Experience',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Medellín Premium Experience',
      description:
        'Premium airport transfers, personalized concierge, and unforgettable experiences across the most vibrant city in Colombia.',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      areaServed: [
        {
          '@type': 'City',
          name: 'Medellín',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'CO',
          },
        },
      ],
    },
    {
      '@type': 'LocalBusiness',
      name: 'Medellín Premium Experience',
      description:
        'Premium tourism experiences in Medellín, Colombia. Your journey begins the moment you land.',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      areaServed: 'Medellín, Colombia',
      priceRange: '$$$',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-bg-dark font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <I18nProvider>
          {children}
          <ChatWidget />
        </I18nProvider>
      </body>
    </html>
  )
}
