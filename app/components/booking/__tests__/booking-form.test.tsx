import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { I18nProvider } from '@/lib/i18n'
import BookingForm from '../booking-form'

vi.mock('../lib/persistence', () => ({
  createPersistence: () => ({
    saveDraft: vi.fn(async () => {}),
    loadDraft: vi.fn(async () => null),
    enqueueRetry: vi.fn(async () => {}),
    submit: vi.fn(async () => ({ status: 'success' })),
    clear: vi.fn(async () => {}),
    getRetryQueue: vi.fn(async () => []),
    dequeueRetry: vi.fn(async () => null),
    removeRetry: vi.fn(async () => {}),
  }),
}))

vi.mock('../lib/flight-validation', () => ({
  createFlightValidation: () => ({
    validateFlight: vi.fn(async (params: { airline: string; flightNumber: string }) => {
      if (params.flightNumber.includes('VALID')) {
        return { valid: true, airlineName: params.airline, flightNumber: params.flightNumber }
      }
      return { valid: false }
    }),
  }),
}))

function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

function renderWithProviders(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('BookingForm', () => {
  it('renders the first step (Flight Logistics)', () => {
    renderWithProviders(<BookingForm />)
    const headings = screen.getAllByText('Flight Logistics')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('navigates to Traveler Profile when Continue is clicked after filling all fields with valid date', () => {
    renderWithProviders(<BookingForm />)

    const flightInput = screen.getByPlaceholderText('e.g. AA1123')
    fireEvent.change(flightInput, { target: { value: 'AA123' } })

    const airlineInput = screen.getByPlaceholderText('e.g. American Airlines')
    fireEvent.change(airlineInput, { target: { value: 'American' } })

    const dateInput = screen.getByLabelText(/arrival date/i)
    fireEvent.change(dateInput, { target: { value: futureDate(30) } })

    const timeInput = screen.getByLabelText(/arrival time/i)
    fireEvent.change(timeInput, { target: { value: '14:00' } })

    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)

    const travelerHeadings = screen.getAllByText('Traveler Profile')
    expect(travelerHeadings.length).toBeGreaterThanOrEqual(1)
  })

  it('disables Continue when flight fields are empty', () => {
    renderWithProviders(<BookingForm />)

    const continueBtn = screen.getByText('Continue')
    expect(continueBtn).toBeDisabled()
  })

  it('enables Continue when all required flight fields are filled with a valid future date', () => {
    renderWithProviders(<BookingForm />)

    const flightInput = screen.getByPlaceholderText('e.g. AA1123')
    fireEvent.change(flightInput, { target: { value: 'AA123' } })

    const airlineInput = screen.getByPlaceholderText('e.g. American Airlines')
    fireEvent.change(airlineInput, { target: { value: 'American' } })

    const dateInput = screen.getByLabelText(/arrival date/i)
    fireEvent.change(dateInput, { target: { value: futureDate(30) } })

    const timeInput = screen.getByLabelText(/arrival time/i)
    fireEvent.change(timeInput, { target: { value: '14:00' } })

    const continueBtn = screen.getByText('Continue')
    expect(continueBtn).not.toBeDisabled()
  })

  it('disables Continue when the arrival date is within 15 days', () => {
    renderWithProviders(<BookingForm />)

    const flightInput = screen.getByPlaceholderText('e.g. AA1123')
    fireEvent.change(flightInput, { target: { value: 'AA123' } })

    const airlineInput = screen.getByPlaceholderText('e.g. American Airlines')
    fireEvent.change(airlineInput, { target: { value: 'American' } })

    const dateInput = screen.getByLabelText(/arrival date/i)
    fireEvent.change(dateInput, { target: { value: futureDate(5) } })

    const timeInput = screen.getByLabelText(/arrival time/i)
    fireEvent.change(timeInput, { target: { value: '14:00' } })

    const continueBtn = screen.getByText('Continue')
    expect(continueBtn).toBeDisabled()
  })

  it('shows flight validation status when flight number and airline are entered', async () => {
    renderWithProviders(<BookingForm />)

    const flightInput = screen.getByPlaceholderText('e.g. AA1123')
    await act(async () => {
      fireEvent.change(flightInput, { target: { value: 'VALID001' } })
    })

    const airlineInput = screen.getByPlaceholderText('e.g. American Airlines')
    await act(async () => {
      fireEvent.change(airlineInput, { target: { value: 'Test Airline' } })
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    const flightConfirmed = await screen.findByText(/Flight confirmed/i)
    expect(flightConfirmed).toBeTruthy()
  })

  it('shows unverified warning when flight is not found', async () => {
    renderWithProviders(<BookingForm />)

    const flightInput = screen.getByPlaceholderText('e.g. AA1123')
    await act(async () => {
      fireEvent.change(flightInput, { target: { value: 'UNKNOWN001' } })
    })

    const airlineInput = screen.getByPlaceholderText('e.g. American Airlines')
    await act(async () => {
      fireEvent.change(airlineInput, { target: { value: 'Unknown Airline' } })
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    const flagged = await screen.findByText(/will be flagged/i)
    expect(flagged).toBeTruthy()
  })
})
