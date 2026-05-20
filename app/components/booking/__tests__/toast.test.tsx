import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../lib/toast'

function TestHarness() {
  const { showToast, dismissToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast({ type: 'success', message: 'Success!' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ type: 'error', message: 'Error!', duration: 0 })}>
        Show Error
      </button>
      <button onClick={() => showToast({ type: 'warning', message: 'Warning!', duration: 8000 })}>
        Show Warning
      </button>
      <button onClick={() => dismissToast('test-id')}>
        Dismiss
      </button>
    </div>
  )
}

describe('ToastProvider + useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders children and provides showToast/dismissToast', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    )
    expect(screen.getByText('Show Success')).toBeInTheDocument()
  })

  it('shows a toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('Show Success'))
    expect(screen.getByRole('alert')).toHaveTextContent('Success!')
  })

  it('auto-dismisses success toast after 5 seconds', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('Show Success'))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(5000) })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('auto-dismisses warning toast after 8 seconds', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('Show Warning'))
    expect(screen.getByRole('alert')).toHaveTextContent('Warning!')

    act(() => { vi.advanceTimersByTime(8000) })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('error toast requires manual dismiss (duration 0)', () => {
    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('Show Error'))

    const toast = screen.getByRole('alert')
    expect(toast).toHaveTextContent('Error!')

    act(() => { vi.advanceTimersByTime(10000) })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('limits concurrent toasts to 3', () => {
    function ManyToasts() {
      const { showToast } = useToast()
      return (
        <div>
          <button onClick={() => {
            showToast({ type: 'info', message: 'Toast 1' })
            showToast({ type: 'info', message: 'Toast 2' })
            showToast({ type: 'info', message: 'Toast 3' })
            showToast({ type: 'info', message: 'Toast 4' })
          }}>
            Show 4 Toasts
          </button>
        </div>
      )
    }

    render(
      <ToastProvider>
        <ManyToasts />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByText('Show 4 Toasts'))

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(3)
  })
})
