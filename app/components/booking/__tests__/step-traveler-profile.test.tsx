import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '@/lib/i18n'
import StepTravelerProfile from '../step-traveler-profile'

function renderWithProviders(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('StepTravelerProfile Accessibility and Interactions', () => {
  const defaultProps = {
    value: 'family',
    onChange: vi.fn(),
    email: 'test@example.com',
    onEmailChange: vi.fn(),
    name: 'Jane Doe',
    onNameChange: vi.fn(),
    phone: '+57 300 123 4567',
    onPhoneChange: vi.fn(),
  }

  it('renders a radiogroup with radio buttons for each traveler profile', () => {
    renderWithProviders(<StepTravelerProfile {...defaultProps} />)

    const radiogroup = screen.getByRole('radiogroup')
    expect(radiogroup).toBeInTheDocument()

    const radioButtons = screen.getAllByRole('radio')
    expect(radioButtons).toHaveLength(4)

    // The selected item has aria-checked="true"
    const familyOption = radioButtons.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Family'),
    )
    expect(familyOption).toHaveAttribute('aria-checked', 'true')

    // Unselected items have aria-checked="false"
    const nomadOption = radioButtons.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Digital Nomad'),
    )
    expect(nomadOption).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when a profile option is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(<StepTravelerProfile {...defaultProps} onChange={onChange} />)

    const radioButtons = screen.getAllByRole('radio')
    const celebrationOption = radioButtons.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Celebration'),
    )
    expect(celebrationOption).toBeDefined()

    if (celebrationOption) {
      await user.click(celebrationOption)
      expect(onChange).toHaveBeenCalledWith('celebration')
    }
  })

  it('marks name, email, and phone inputs as required and aria-required', () => {
    renderWithProviders(<StepTravelerProfile {...defaultProps} />)

    const nameInput = screen.getByLabelText(/Full Name/i)
    const emailInput = screen.getByLabelText(/Email/i)
    const phoneInput = screen.getByLabelText(/Phone/i)

    expect(nameInput).toBeRequired()
    expect(nameInput).toHaveAttribute('aria-required', 'true')

    expect(emailInput).toBeRequired()
    expect(emailInput).toHaveAttribute('aria-required', 'true')

    expect(phoneInput).toBeRequired()
    expect(phoneInput).toHaveAttribute('aria-required', 'true')
  })
})
