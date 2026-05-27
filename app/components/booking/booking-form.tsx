'use client'

import { useState } from 'react'
import Link from 'next/link'
import StepProgress from './step-progress'
import StepFlightLogistics from './step-flight-logistics'
import StepTravelerProfile from './step-traveler-profile'
import StepDestination from './step-destination'
import StepPackages from './step-packages'
import StepPayment from './step-payment'
import BookingConfirmation from './booking-confirmation'
import Button from '@/app/components/ui/button'
import LangToggle from '@/app/components/ui/lang-toggle'
import { ToastProvider, useToast } from './lib/toast'
import { ErrorBoundary } from './lib/error-boundary'
import { createPersistence } from './lib/persistence'
import { useI18n } from '@/lib/i18n'
import type { Booking, DestinationData } from './lib/types'
import { logBookingEvent, logBookingError } from './lib/logger'

type Step = 0 | 1 | 2 | 3 | 4

const TOTAL_STEPS = 5

const persistence = createPersistence()

function getStepDetails(t: ReturnType<typeof useI18n>['t']) {
  return [
    {
      label: t.booking.steps.flight.label,
      description: t.booking.steps.flight.description,
    },
    {
      label: t.booking.steps.profile.label,
      description: t.booking.steps.profile.description,
    },
    {
      label: t.booking.steps.destination.label,
      description: t.booking.steps.destination.description,
    },
    {
      label: t.booking.steps.packages.label,
      description: t.booking.steps.packages.description,
    },
    {
      label: t.booking.steps.payment.label,
      description: t.booking.steps.payment.description,
    },
  ]
}

function DesktopStepProgress({ currentStep, stepDetails }: { currentStep: number; stepDetails: ReturnType<typeof getStepDetails> }) {
  return (
    <div className="relative">
      <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-[var(--border)]" />
      <div className="space-y-0">
        {stepDetails.map((s, i) => {
          const isCompleted = i < currentStep
          const isCurrent = i === currentStep
          const isUpcoming = i > currentStep
          return (
            <div key={s.label} className="relative flex items-start gap-4 pb-10 last:pb-0">
              <div className="relative z-10 shrink-0">
                {isCompleted ? (
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-gold)] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bg-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-card)] border-2 border-[var(--accent-gold)] flex items-center justify-center shadow-[0_0_0_4px_rgba(212,165,116,0.15)]">
                    <span className="text-label-sm font-bold text-[var(--accent-gold)]">{i + 1}</span>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] flex items-center justify-center">
                    <span className="text-label-sm font-bold text-[var(--text-muted)]">{i + 1}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 pt-1">
                <p className={`text-label-md font-semibold ${
                  isCurrent ? 'text-[var(--accent-gold)]' : isCompleted ? 'text-white' : 'text-[var(--text-muted)]'
                }`}>
                  {s.label}
                </p>
                <p className={`text-body-md mt-0.5 ${
                  isCurrent ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {s.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BookingFormInner() {
  const { t } = useI18n()
  const stepDetails = getStepDetails(t)
  const [step, setStep] = useState<Step>(0)
  const [flightData, setFlightData] = useState({
    flightNumber: '',
    airline: '',
    arrivalDate: '',
    arrivalTime: '',
    needReturn: false,
    returnDate: '',
    returnTime: '',
  })
  const [profile, setProfile] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerCountry, setCustomerCountry] = useState('')
  const [customerLanguage, setCustomerLanguage] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [destination, setDestination] = useState<DestinationData>({
    hasPlace: true,
    address: '',
    wantsGuatape: false,
    additionalTrips: [],
  })
  const [selectedPackage, setSelectedPackage] = useState('')
  const [bookingReference] = useState(() =>
    crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  )
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast, dismissToast } = useToast()

  const canProceed = () => {
    switch (step) {
      case 0: {
        const fieldsFilled =
          !!flightData.flightNumber.trim() &&
          !!flightData.airline.trim() &&
          !!flightData.arrivalDate &&
          !!flightData.arrivalTime
        if (!fieldsFilled) return false
        const today = new Date()
        const target = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        target.setDate(target.getDate() + 10)
        const minDateStr = target.toISOString().split('T')[0]
        return flightData.arrivalDate >= minDateStr
      }
      case 1:
        return !!profile && !!customerEmail.trim() && !!customerName.trim() && !!customerPhone.trim()
      case 2:
        return true
      case 3:
        return !!selectedPackage
    }
  }

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) setStep((step + 1) as Step)
  }

  const prevStep = () => {
    if (step > 0) setStep((step - 1) as Step)
  }

  const handlePaymentSuccess = async () => {
    const booking = {
      id: bookingReference,
      flight: flightData,
      profile,
      destination,
      package: selectedPackage,
      status: 'submitted' as const,
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        country: customerCountry,
        language: customerLanguage,
        notes: customerNotes,
      },
    }

    logBookingEvent('Submitting booking after payment', { id: booking.id })

    try {
      await persistence.submit(booking)
      logBookingEvent('Booking confirmed after payment', { id: booking.id })
    } catch (err) {
      logBookingError('Payment submission', err)
      const toastId = showToast({
        type: 'warning',
        message: t.booking.toast.offline,
        action: {
          label: t.common.dismiss,
          onClick: () => dismissToast(toastId),
        },
      })
    } finally {
      setSubmitted(true)
    }
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)

    const booking = {
      id: bookingReference,
      flight: flightData,
      profile,
      destination,
      package: selectedPackage,
      status: 'submitted' as const,
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        country: customerCountry,
        language: customerLanguage,
        notes: customerNotes,
      },
    }

    logBookingEvent('Submitting booking', { id: booking.id })

    try {
      await persistence.submit(booking)
      logBookingEvent('Booking confirmed', { id: booking.id })
      showToast({ type: 'success', message: t.booking.toast.success })
      setSubmitted(true)
    } catch (err) {
      logBookingError('Submission', err)

      await persistence.enqueueRetry({
        id: `retry-${Date.now()}`,
        booking,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        lastError: err instanceof Error ? err.message : String(err),
      })

      const toastId = showToast({
        type: 'error',
        message: t.booking.toast.offline,
        action: {
          label: t.common.dismiss,
          onClick: () => dismissToast(toastId),
        },
      })

      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col">
        <header className="bg-[var(--bg-card)] border-b border-[var(--border)]">
          <div className="mx-auto max-w-container px-4 md:px-12 py-4 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl font-semibold text-white no-underline tracking-tight">
              Medellín{' '}
              <span className="text-[var(--accent-gold)]">Premium</span>
            </Link>
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-[var(--glass)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)] transition-all"
              aria-label="Close and return to home"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 md:px-12 py-12">
          <BookingConfirmation onReset={() => window.location.reload()} bookingReference={bookingReference} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-container px-4 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-semibold text-white no-underline tracking-tight">
            Medellín{' '}
            <span className="text-[var(--accent-gold)]">Premium</span>
          </Link>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-[var(--glass)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)] transition-all"
              aria-label="Close and return to home"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-container px-4 md:px-12 py-8 md:py-12">
          <div className="md:grid md:grid-cols-[280px_1fr] md:gap-12 lg:gap-16">
            <aside className="hidden md:block">
              <div className="md:sticky md:top-8 pt-8">
                <DesktopStepProgress currentStep={step} stepDetails={stepDetails} />
              </div>
            </aside>

            <div>
              <div className="md:hidden mb-8">
                <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
              </div>

              <div className="bg-[var(--bg-card)] rounded-[var(--radius-xl)] p-6 md:p-10 lg:p-12 border border-[var(--border)]">
                {step === 0 && (
                  <StepFlightLogistics
                    data={flightData}
                    onChange={setFlightData}
                  />
                )}
                {step === 1 && (
                  <StepTravelerProfile
                    value={profile}
                    onChange={setProfile}
                    email={customerEmail}
                    onEmailChange={setCustomerEmail}
                    name={customerName}
                    onNameChange={setCustomerName}
                    phone={customerPhone}
                    onPhoneChange={setCustomerPhone}
                    country={customerCountry}
                    onCountryChange={setCustomerCountry}
                    language={customerLanguage}
                    onLanguageChange={setCustomerLanguage}
                  />
                )}
                {step === 2 && (
                  <StepDestination
                    data={destination}
                    onChange={setDestination}
                    customerNotes={customerNotes}
                    onCustomerNotesChange={setCustomerNotes}
                  />
                )}
                {step === 3 && (
                  <StepPackages
                    value={selectedPackage}
                    onChange={setSelectedPackage}
                  />
                )}

                {step === 4 && (
                  <StepPayment
                    bookingReference={bookingReference}
                    packageId={selectedPackage}
                    customerEmail={customerEmail}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    flightData={flightData}
                    destinationAddress={destination.address}
                    needReturn={flightData.needReturn}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={() => {}}
                  />
                )}

                {step < 4 && (
                  <div className="flex items-center justify-between mt-10 pt-6 border-t border-[var(--border)]">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      disabled={step === 0}
                    >
                      {t.common.back}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={nextStep}
                      disabled={!canProceed()}
                    >
                      {t.common.continue}
                    </Button>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex items-center justify-start mt-6 pt-6 border-t border-[var(--border)]">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                    >
                      {t.booking.steps.payment.backToPackages}
                    </Button>
                  </div>
                )}
              </div>

              {step === 4 && (
                <div className="mt-10 p-6 md:p-10 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)] border border-[var(--border)] text-center">
                  <p className="text-display-md mb-2 text-white">{t.booking.confirmation.stressFree}</p>
                  <p className="text-body-md text-[var(--text-secondary)] max-w-lg mx-auto">
                    {t.booking.confirmation.stressFreeDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[var(--bg-card)] border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-container px-4 md:px-12 text-center">
          <p className="text-body-md text-[var(--text-muted)]">
            {t.footer.copyright.replace('{year}', String(new Date().getFullYear()))}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function BookingForm() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BookingFormInner />
      </ToastProvider>
    </ErrorBoundary>
  )
}
