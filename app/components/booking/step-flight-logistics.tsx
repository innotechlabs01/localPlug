'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { createFlightValidation } from './lib/flight-validation'

interface FlightData {
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
  needReturn: boolean
  returnDate: string
  returnTime: string
}

interface StepFlightLogisticsProps {
  data: FlightData
  onChange: (data: FlightData) => void
}

function getMinDate(): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  today.setDate(today.getDate() + 10)
  return today.toISOString().split('T')[0]
}

const flightValidation = createFlightValidation({ latency: 300 })

export default function StepFlightLogistics({ data, onChange }: StepFlightLogisticsProps) {
  const { t } = useI18n()
  const flightT = t.booking.steps.flight
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [validatedFlight, setValidatedFlight] = useState('')

  const handleChange = (field: keyof FlightData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({ ...data, [field]: e.target.value })
  }

  const toggleReturn = () => {
    onChange({ ...data, needReturn: !data.needReturn })
  }

  const minDate = getMinDate()

  useEffect(() => {
    const airline = data.airline.trim()
    const flightNumber = data.flightNumber.trim()

    if (!airline || !flightNumber) {
      setValidationStatus('idle')
      setValidatedFlight('')
      return
    }

    const timer = setTimeout(async () => {
      const result = await flightValidation.validateFlight({ airline, flightNumber })
      if (result.valid) {
        setValidationStatus('valid')
        setValidatedFlight(result.flightNumber || flightNumber)
      } else {
        setValidationStatus('invalid')
        setValidatedFlight('')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [data.airline, data.flightNumber])

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{flightT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {flightT.subtitle}
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="flightNumber" className="text-label-md text-[var(--text-primary)]">
              {flightT.flightNumber} <span className="text-red-500">*</span>
            </label>
            <input
              id="flightNumber"
              type="text"
              placeholder={flightT.flightNumberPlaceholder}
              value={data.flightNumber}
              onChange={handleChange('flightNumber')}
              className="w-full px-3 py-3 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="airline" className="text-label-md text-[var(--text-primary)]">
              {flightT.airline} <span className="text-red-500">*</span>
            </label>
            <input
              id="airline"
              type="text"
              placeholder={flightT.airlinePlaceholder}
              value={data.airline}
              onChange={handleChange('airline')}
              className="w-full px-3 py-3 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
              required
            />
          </div>
        </div>

        {validationStatus !== 'idle' && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] text-sm ${
            validationStatus === 'valid'
              ? 'bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[#22c55e]'
              : 'bg-[rgba(234,179,8,0.12)] border border-[rgba(234,179,8,0.25)] text-[#eab308]'
          }`}>
            {validationStatus === 'valid' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>
              {validationStatus === 'valid'
                ? `${flightT.flightConfirmed} ${validatedFlight}`
                : flightT.flightNotFound
              }
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arrivalDate" className="text-label-md text-[var(--text-primary)]">
              {flightT.arrivalDate} <span className="text-red-500">*</span>
            </label>
            <input
              id="arrivalDate"
              type="date"
              value={data.arrivalDate}
              min={minDate}
              onChange={handleChange('arrivalDate')}
              className="w-full px-3 py-3 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 [color-scheme:dark]"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arrivalTime" className="text-label-md text-[var(--text-primary)]">
              {flightT.arrivalTime} <span className="text-red-500">*</span>
            </label>
            <input
              id="arrivalTime"
              type="time"
              value={data.arrivalTime}
              onChange={handleChange('arrivalTime')}
              className="w-full px-3 py-3 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 [color-scheme:dark]"
              required
            />
          </div>
        </div>

        {/* Return transportation toggle */}
        <label className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent-gold)] transition-all duration-200 bg-[var(--bg-elevated)]">
          <input
            type="checkbox"
            checked={data.needReturn}
            onChange={toggleReturn}
            className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 focus:ring-2 shrink-0"
          />
          <span className="text-body-md text-[var(--text-primary)]">
            {flightT.needReturn || 'I also need return transportation to the airport'}
          </span>
        </label>

        {data.needReturn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pl-2 border-l-2 border-[var(--accent-gold)]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="returnDate" className="text-label-md text-[var(--text-primary)]">
                {flightT.returnDate || 'Return Date'}
              </label>
              <input
                id="returnDate"
                type="date"
                value={data.returnDate}
                onChange={handleChange('returnDate')}
                min={minDate}
                className="w-full px-3 py-3 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="returnTime" className="text-label-md text-[var(--text-primary)]">
                {flightT.returnTime || 'Return Time'}
              </label>
              <input
                id="returnTime"
                type="time"
                value={data.returnTime}
                onChange={handleChange('returnTime')}
                className="w-full px-3 py-3 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[rgba(212,165,116,0.1)] border border-[rgba(212,165,116,0.2)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-body-md text-[var(--accent-gold-light)]">
            {flightT.advanceNotice}
          </p>
        </div>
      </div>
    </div>
  )
}
