import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ClerkProvider } from '@clerk/nextjs'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { I18nProvider, type Lang } from '@/lib/i18n'
import { Providers } from './providers'
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
  icons: {
    icon: '/icon/icon.png',
    apple: '/icon/icon.png',
  },
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
      telephone: '+573001234567',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Cra. 43A # 10-45',
        addressLocality: 'Medellín',
        addressRegion: 'Antioquia',
        addressCountry: 'CO',
      },
      sameAs: [
        'https://instagram.com/medellinwithoutstress',
        'https://facebook.com/medellinwithoutstress',
      ],
    },
    {
      '@type': 'Product',
      name: 'The Welcome Pack',
      description: 'VIP Airport Pickup, Premium SUV, Fast-Track Route, Local Essentials, Instant Connectivity.',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      offers: {
        '@type': 'Offer',
        price: '149.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'The 24h Insider',
      description: 'Everything in The Welcome Pack, Neighborhood Match, VIP Check-in Assistance, Local Orientation Tour, Digital Set-up.',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      offers: {
        '@type': 'Offer',
        price: '199.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'The Medellin Freedom Pass',
      description: 'Round-Trip Guarantee, 24/7 AI WhatsApp Concierge, Human Safety Net, Accommodation Validation.',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      offers: {
        '@type': 'Offer',
        price: '399.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuánto tiempo antes debo reservar mi traslado al aeropuerto?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Recomendamos reservar con al menos 10 días de anticipación para garantizar disponibilidad del conductor y vehículo.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Incluye el traslado de regreso al aeropuerto?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El traslado de regreso es opcional y se puede agregar al momento de la reserva con un cargo adicional.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué pasa si mi vuelo se retrasa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Monitoreamos tu vuelo en tiempo real y ajustamos la hora de recogida sin costo adicional.',
          },
        },
      ],
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4.9',
        bestRating: '5',
      },
      author: {
        '@type': 'Person',
        name: 'Sarah J.',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Medellín Premium',
      },
      reviewBody: 'The transition from the airport to my hotel was completely seamless.',
    },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const initialLang = (cookieStore.get('localplug-lang')?.value === 'es' ? 'es' : 'en') as Lang

  return (
    <html lang={initialLang} suppressHydrationWarning className={`${playfairDisplay.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-bg-dark font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClerkProvider>
          <I18nProvider initialLang={initialLang}>
            <Providers>{children}</Providers>
          </I18nProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
